import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework.permissions import AllowAny

from .models import User, Complaint
from .serializers import (
    UserSerializer, UserCreateSerializer,
    ComplaintSerializer, ComplaintCreateSerializer,
    AssignComplaintSerializer,
    PublicComplaintSerializer,
)
from .utils import is_within_radius

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'service': 'citycare-api',
    })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def collectors(self, request):
        collectors = User.objects.filter(role='COLLECTOR')
        serializer = UserSerializer(collectors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        if request.user.is_authenticated:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        return Response({'error': 'Not authenticated'}, status=401)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        role = request.data.get('role', 'CITIZEN')
        
        if not username:
            return Response({'error': 'Username is required.'}, status=400)
        if not password:
            return Response({'error': 'Password is required.'}, status=400)
        
        if role == 'CITIZEN' and username == 'guest':
            guest_user, created = User.objects.get_or_create(
                username='guest',
                defaults={'role': 'CITIZEN'}
            )
            guest_user.set_password('guest')
            guest_user.save()
            login(request, guest_user)
            return Response({'message': 'Guest login successful', 'user': UserSerializer(guest_user).data})
        
        user = authenticate(username=username, password=password)
        if user:
            if user.role != role:
                return Response({'error': f'This account is registered as {user.get_role_display()}, not {role.title()}.'}, status=403)
            login(request, user)
            return Response({'message': 'Login successful', 'user': UserSerializer(user).data})
        
        return Response({'error': 'Invalid credentials'}, status=401)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'message': 'CSRF cookie set'})


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Complaint.objects.select_related(
            'complainant', 'assigned_to', 'assigned_by'
        )
        status_filter = self.request.query_params.get('status')
        assigned_to = self.request.query_params.get('assigned_to')
        
        if status_filter:
            queryset = queryset.filter(status__in=status_filter.split(','))
            
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
            
        return queryset.order_by('-urgency_level', '-created_at')
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = ComplaintCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            location_coords = serializer.validated_data.get('location_coords', '')
            location_address = serializer.validated_data.get('location_address', '')
            complainant_name = serializer.validated_data.get('complainant_name', '')
            
            complainant = request.user if request.user.is_authenticated else None
            
            now = timezone.now()
            
            if complainant:
                one_hour_ago = now - timedelta(hours=1)
                recent_count = Complaint.objects.filter(
                    complainant=complainant,
                    created_at__gte=one_hour_ago,
                    location_coords=location_coords
                ).count()
                
                if recent_count >= 5:
                    return Response({'error': 'Spam detected'}, status=429)

            twenty_four_hours_ago = now - timedelta(hours=24)
            potential_duplicates = Complaint.objects.filter(
                status__in=['PENDING', 'ASSIGNED'],
                created_at__gte=twenty_four_hours_ago
            )
            
            for existing in potential_duplicates:
                if (is_within_radius(existing.location_coords, location_coords, 50) or
                    existing.location_address.lower() == location_address.lower()):
                    
                    existing.urgency_level += 1
                    existing.save()
                    
                    return Response({
                        'message': 'Duplicate found. Urgency increased.',
                        'complaint': ComplaintSerializer(existing).data,
                        'is_duplicate': True
                    })

            complaint = Complaint.objects.create(
                complainant=complainant,
                complainant_name=complainant_name,
                location_coords=location_coords,
                location_address=location_address,
                image_before=request.FILES.get('image_before')
            )
            
            return Response({
                'message': 'Complaint submitted',
                'complaint': ComplaintSerializer(complaint).data,
                'is_duplicate': False
            }, status=201)
            
        except serializers.ValidationError as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Complaint creation failed unexpectedly")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        try:
            complaint = self.get_object()
        except Http404:
            return Response({'error': 'Complaint not found'}, status=404)

        serializer = AssignComplaintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            collector = User.objects.get(id=serializer.validated_data['collector_id'])
        except User.DoesNotExist:
            return Response({'error': 'Collector not found'}, status=404)

        complaint.assigned_to = collector
        complaint.assigned_by = request.user
        complaint.status = 'ASSIGNED'
        complaint.save()

        return Response({'message': 'Assigned', 'complaint': ComplaintSerializer(complaint).data})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        try:
            complaint = self.get_object()
        except Http404:
            return Response({'error': 'Complaint not found'}, status=404)

        image_file = request.FILES.get('image_after')
        if image_file:
            complaint.image_after = image_file

        complaint.status = 'RESOLVED'
        complaint.save()
        return Response({'message': 'Resolved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            complaint = self.get_object()
        except Http404:
            return Response({'error': 'Complaint not found'}, status=404)

        reason = request.data.get('reason')
        complaint.status = 'REJECTED'
        complaint.rejected_reason = reason
        complaint.save()
        return Response({'message': 'Rejected'})


class SimulateTimeoutView(APIView):
    def post(self, request):
        complaint_ids = request.data.get('complaint_ids', [])
        
        if complaint_ids:
            updated_count = Complaint.objects.filter(id__in=complaint_ids).update(status='ESCALATED')
        else:
            cutoff = timezone.now() - timedelta(hours=16)
            updated_count = Complaint.objects.filter(
                status__in=['PENDING', 'ASSIGNED'],
                created_at__lt=cutoff
            ).update(status='ESCALATED')

            updated_count += Complaint.objects.filter(
                 status__in=['PENDING', 'ASSIGNED'],
                 force_escalate=True
            ).update(status='ESCALATED')
            
        return Response({'message': f'{updated_count} escalated'})


@api_view(['GET'])
def dashboard_stats(request):
    from django.db.models import Count
    status_counts = Complaint.objects.values('status').annotate(count=Count('id'))
    counts = {item['status']: item['count'] for item in status_counts}
    pending = counts.get('PENDING', 0)
    assigned = counts.get('ASSIGNED', 0)
    return Response({
        'total': sum(counts.values()),
        'pending': pending,
        'assigned': assigned,
        'resolved': counts.get('RESOLVED', 0),
        'rejected': counts.get('REJECTED', 0),
        'escalated': counts.get('ESCALATED', 0),
    'active': pending + assigned,
})


class PublicComplaintLookupView(APIView):
    """No-auth endpoint to look up a complaint by CC-ID. Returns only public-safe fields."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, complaint_id):
        try:
            complaint = Complaint.objects.select_related(
                'complainant', 'assigned_to', 'assigned_by'
            ).get(complaint_id=complaint_id)
            return Response(PublicComplaintSerializer(complaint).data)
        except Complaint.DoesNotExist:
            return Response(
                {'error': 'Complaint not found'},
                status=status.HTTP_404_NOT_FOUND
            )
