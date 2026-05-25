from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile, CompanyProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea automáticamente un UserProfile cuando se crea cualquier usuario.
    Si el usuario es de tipo 'company', también crea un CompanyProfile vacío.
    """
    if created:
        UserProfile.objects.create(user=instance)

        if instance.profile_type == 'company':
            CompanyProfile.objects.get_or_create(
                user=instance,
                defaults={'company_name': instance.email}
            )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Guarda el perfil cuando se guarda el usuario.
    Si cambió a 'company' y aún no tiene CompanyProfile, lo crea.
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.get_or_create(user=instance)

    # Garantizar CompanyProfile para usuarios empresa
    if instance.profile_type == 'company':
        CompanyProfile.objects.get_or_create(
            user=instance,
            defaults={'company_name': instance.email}
        )