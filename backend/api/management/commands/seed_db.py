from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Delete existing complaints and re-seed')

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')
        
        users_data = [
            {'username': 'admin', 'password': 'admin', 'role': 'OFFICER', 'email': 'admin@citycare.com'},
            {'username': 'inspector', 'password': 'admin', 'role': 'INSPECTOR', 'email': 'inspector@citycare.com'},
            {'username': 'collector1', 'password': 'admin', 'role': 'COLLECTOR', 'email': 'col1@citycare.com', 'first_name': 'John Doe'},
            {'username': 'collector2', 'password': 'admin', 'role': 'COLLECTOR', 'email': 'col2@citycare.com', 'first_name': 'Jane Smith'},
            {'username': 'officer', 'password': 'admin', 'role': 'OFFICER', 'email': 'officer@citycare.com'},
        ]
        
        for u in users_data:
            user, created = User.objects.get_or_create(username=u['username'], defaults={
                'role': u['role'],
                'email': u['email'],
                'first_name': u.get('first_name', '')
            })
            user.set_password(u['password'])
            user.save()
            if created:
                self.stdout.write(f"Created user: {u['username']} ({u['role']})")
            else:
                self.stdout.write(f"Updated password for existing user: {u['username']}")
        
        from api.models import Complaint
        
        if options.get('force'):
            Complaint.objects.all().delete()
            self.stdout.write('Force flag: deleted existing complaints.')
        elif Complaint.objects.exists():
            self.stdout.write('Complaints already exist. Use --force to re-seed.')
            return

        guest_user, created = User.objects.get_or_create(
            username='guest',
            defaults={'role': 'CITIZEN', 'email': 'guest@citycare.com'}
        )
        guest_user.set_password('guest')
        guest_user.save()
        if created:
            self.stdout.write("Created guest user")
        else:
            self.stdout.write("Updated password for guest user")
        citizen_user = guest_user

        complaints_data = [
            {
                'complainant': citizen_user,
                'complainant_name': 'John Doe',
                'location_coords': '11.0168,76.9558',
                'location_address': 'Gandhipuram, Coimbatore',
                'status': 'PENDING',
                'urgency_level': 1
            },
            {
                'complainant': citizen_user,
                'complainant_name': 'Jane Doe',
                'location_coords': '11.0045,76.9616',
                'location_address': 'RS Puram, Coimbatore',
                'status': 'ASSIGNED',
                'urgency_level': 2,
                'assigned_to': User.objects.get(username='collector1')
            }
        ]
        
        for c in complaints_data:
            Complaint.objects.create(**c)
            self.stdout.write(f"Created complaint at {c['location_address']}")

        self.stdout.write(self.style.SUCCESS('Data seeding completed successfully!'))
