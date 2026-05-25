"""Seed de datos de prueba para perfiles Empresa Web.

Crea 3 usuarios empresa, 3 organizaciones, 1 curso por organización,
y varios estudiantes con desempeño variado para poblar el dashboard.

Uso:
    python manage.py seed_empresa_test_data
    python manage.py seed_empresa_test_data --reset   # borra y recrea

Es idempotente: ejecutarlo dos veces no duplica filas.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.text import slugify

from users.models import CompanyProfile
from organizations.models import Organization, OrganizationAdmin
from enterprise_courses.models import Course, CourseLessonConfig
from student_management.models import StudentEnrollment
from lessons.models import Lesson


User = get_user_model()

# Password coherente con el tipo de perfil
COMPANY_PASSWORD  = 'Empresa123!'
STUDENT_PASSWORD  = 'Estudiante123!'

EMPRESA_USERS = [
    {
        'email': 'admin@tradingpro.test',
        'username': 'tradingpro_admin',
        'first_name': 'Lucía',
        'last_name': 'Fernández',
        'company_name': 'TradingPro Academy',
        'industry': 'Educación financiera',
        'company_size': '51-200',
        'tax_id': '20100200300',
        'company_country': 'Perú',
        'company_city': 'Lima',
        'org_type': 'trading_academy',
        'plan': 'premium',
        'max_students': 500,
    },
    {
        'email': 'admin@fintechuni.test',
        'username': 'fintechuni_admin',
        'first_name': 'Carlos',
        'last_name': 'Rodríguez',
        'company_name': 'FinTech University',
        'industry': 'Educación superior',
        'company_size': '200+',
        'tax_id': '20500600700',
        'company_country': 'México',
        'company_city': 'CDMX',
        'org_type': 'university',
        'plan': 'enterprise',
        'max_students': 1000,
    },
    {
        'email': 'admin@cryptobootcamp.test',
        'username': 'cryptobc_admin',
        'first_name': 'Sofía',
        'last_name': 'Martínez',
        'company_name': 'Crypto Bootcamp',
        'industry': 'Cripto / Trading',
        'company_size': '11-50',
        'tax_id': '20900800700',
        'company_country': 'Argentina',
        'company_city': 'Buenos Aires',
        'org_type': 'bootcamp',
        'plan': 'standard',
        'max_students': 200,
    },
]

# (first_name, last_name, grade, lessons_completed, time_min, quizzes, backtests, status)
STUDENT_PROFILES_ORG1 = [
    ('Andrea',  'Gómez',     94.5, 5, 920, 8, 12, 'active'),
    ('Bruno',   'Silva',     91.2, 5, 880, 7, 10, 'active'),
    ('Camila',  'Torres',    86.3, 4, 720, 6,  8, 'active'),
    ('Diego',   'Vargas',    82.7, 4, 660, 5,  7, 'active'),
    ('Elena',   'Ríos',      78.0, 3, 540, 4,  5, 'active'),
    ('Felipe',  'Herrera',   75.5, 3, 480, 4,  4, 'active'),
    ('Gabriela','Castro',    66.4, 3, 420, 3,  3, 'active'),
    ('Hugo',    'Núñez',     58.9, 2, 280, 2,  2, 'active'),
    ('Iván',    'Mendoza',   45.0, 1,  60, 0,  0, 'active'),  # at risk
    ('Julia',   'Paredes',   38.5, 0,  30, 0,  0, 'active'),  # at risk
    ('Kevin',   'Salazar',    0.0, 0,   0, 0,  0, 'enrolled'),
    ('Laura',   'Vega',     100.0, 5,1100, 8, 15, 'completed'),
]

STUDENT_PROFILES_ORG2 = [
    ('Marcos',  'Aguirre',   88.0, 4, 700, 6,  9, 'active'),
    ('Natalia', 'Cordero',   72.5, 3, 510, 4,  5, 'active'),
    ('Oscar',   'Delgado',   52.0, 1, 110, 1,  1, 'active'),  # at risk
    ('Paula',   'Esteban',    0.0, 0,   0, 0,  0, 'enrolled'),
]

STUDENT_PROFILES_ORG3 = [
    ('Renato',  'Flores',    95.0, 5, 950, 8, 14, 'active'),
    ('Sara',    'Guzmán',    81.5, 4, 640, 5,  7, 'active'),
    ('Tomás',   'Iturri',    61.0, 2, 320, 2,  2, 'active'),
]


class Command(BaseCommand):
    help = 'Crea datos de prueba para perfiles Empresa Web (usuarios, orgs, cursos, estudiantes).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina los datos de prueba existentes antes de crearlos.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self._reset()

        lessons = list(Lesson.objects.all()[:5])
        if not lessons:
            self.stdout.write(self.style.WARNING(
                'No hay lecciones en la BD. Los cursos no tendrán contenido y '
                'completion_percentage será 0. Ejecuta antes el seed de lecciones si lo tienes.'
            ))

        student_profiles_by_org = [
            STUDENT_PROFILES_ORG1,
            STUDENT_PROFILES_ORG2,
            STUDENT_PROFILES_ORG3,
        ]

        for cfg, profiles in zip(EMPRESA_USERS, student_profiles_by_org):
            user = self._create_company_user(cfg)
            org  = self._create_organization(cfg, user)
            self._link_admin(user, org)
            course = self._create_course(org, lessons)
            self._enroll_students(org, course, profiles)

        self.stdout.write(self.style.SUCCESS('\n[OK] Seed completado.'))
        self.stdout.write('\nCredenciales de empresa (password: %s):' % COMPANY_PASSWORD)
        for cfg in EMPRESA_USERS:
            self.stdout.write(f"  *{cfg['email']}  ->  {cfg['company_name']}")
        self.stdout.write('\nCredenciales de estudiantes (password: %s):' % STUDENT_PASSWORD)
        self.stdout.write('  *student.andrea@criptoself.test  (top performer org 1)')
        self.stdout.write('  *student.ivan@criptoself.test    (en riesgo org 1)')
        self.stdout.write('  *student.renato@criptoself.test  (top performer org 3)')

    # ── helpers ──────────────────────────────────────────────────────────────

    def _reset(self):
        emails = [c['email'] for c in EMPRESA_USERS]
        student_emails_prefix = 'student.'
        deleted_users = User.objects.filter(
            email__in=emails
        ).delete()
        deleted_students = User.objects.filter(
            email__startswith=student_emails_prefix,
            email__endswith='@criptoself.test',
        ).delete()
        self.stdout.write(self.style.WARNING(
            f'Reset: empresas eliminadas={deleted_users[0]}, estudiantes={deleted_students[0]}'
        ))

    def _create_company_user(self, cfg):
        user, created = User.objects.get_or_create(
            email=cfg['email'],
            defaults={
                'username':     cfg['username'],
                'first_name':   cfg['first_name'],
                'last_name':    cfg['last_name'],
                'profile_type': 'company',
                'is_verified':  True,
                'email_verified': True,
            },
        )
        if created:
            user.set_password(COMPANY_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'+ Usuario empresa: {user.email}'))
        else:
            # Mantener profile_type y password actualizados al re-ejecutar
            user.profile_type = 'company'
            user.set_password(COMPANY_PASSWORD)
            user.save()
            self.stdout.write(f'. Usuario empresa actualizado: {user.email}')

        CompanyProfile.objects.update_or_create(
            user=user,
            defaults={
                'company_name':    cfg['company_name'],
                'industry':        cfg['industry'],
                'company_size':    cfg['company_size'],
                'tax_id':          cfg['tax_id'],
                'company_country': cfg['company_country'],
                'company_city':    cfg['company_city'],
            },
        )
        return user

    def _create_organization(self, cfg, user):
        now = timezone.now()
        org, created = Organization.objects.get_or_create(
            slug=slugify(cfg['company_name']),
            defaults={
                'name':              cfg['company_name'],
                'organization_type': cfg['org_type'],
                'email':             cfg['email'],
                'country':           cfg['company_country'],
                'city':              cfg['company_city'],
                'subscription_plan': cfg['plan'],
                'max_students':      cfg['max_students'],
                'subscription_start': now,
                'subscription_end':   now + timedelta(days=180),
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'+ Organización: {org.name}'))
        else:
            self.stdout.write(f'· Organización ya existe: {org.name}')
        return org

    def _link_admin(self, user, org):
        admin, created = OrganizationAdmin.objects.update_or_create(
            user=user,
            defaults={
                'organization':        org,
                'is_primary_admin':    True,
                'can_manage_students': True,
                'can_create_courses':  True,
                'can_view_analytics':  True,
                'can_manage_organization': True,
            },
        )
        if created:
            self.stdout.write(f'  -admin link creado para {org.name}')

    def _create_course(self, org, lessons):
        now = timezone.now()
        course, created = Course.objects.get_or_create(
            organization=org,
            code='TRD-101',
            defaults={
                'name':                'Fundamentos de Trading',
                'description':         'Curso introductorio a los mercados financieros y el trading.',
                'start_date':          now,
                'end_date':            now + timedelta(weeks=12),
                'enrollment_deadline': now + timedelta(weeks=2),
                'passing_grade':       70,
                'max_quiz_attempts':   3,
                'status':              'published',
            },
        )
        if created:
            self.stdout.write(f'  -curso creado: {course.name}')
        # Asociar lecciones (si existen)
        for idx, lesson in enumerate(lessons, start=1):
            CourseLessonConfig.objects.get_or_create(
                course=course,
                lesson=lesson,
                defaults={'order': idx, 'is_required': True},
            )
        return course

    def _enroll_students(self, org, course, profiles):
        for idx, (fname, lname, grade, completed, time_min, quizzes, backtests, status) in enumerate(profiles):
            slug_name = slugify(fname)
            email = f'student.{slug_name}@criptoself.test'
            student, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username':     f'{slug_name}_{org.slug[:8]}',
                    'first_name':   fname,
                    'last_name':    lname,
                    'profile_type': 'web_user',
                    'is_verified':  True,
                },
            )
            # Reaplicar password siempre (idempotente y permite cambiar la constante)
            student.set_password(STUDENT_PASSWORD)
            student.save()

            enrollment, e_created = StudentEnrollment.objects.get_or_create(
                student=student,
                organization=org,
                course=course,
                defaults={
                    'institutional_id': f'{org.slug[:4].upper()}-{idx+1:04d}',
                    'status':              status,
                    'overall_grade':       grade,
                    'lessons_completed':   completed,
                    'time_spent_minutes':  time_min,
                    'quizzes_passed':      quizzes,
                    'backtests_performed': backtests,
                },
            )
            if not e_created:
                # Mantener datos actualizados con cada ejecución
                enrollment.status = status
                enrollment.overall_grade = grade
                enrollment.lessons_completed = completed
                enrollment.time_spent_minutes = time_min
                enrollment.quizzes_passed = quizzes
                enrollment.backtests_performed = backtests
                enrollment.save()

        self.stdout.write(f'  -{len(profiles)} estudiantes en {org.name}')
