from django.conf import settings
from django.core.mail import send_mail


def send_account_activation_email( email , email_token, current_site):
    subject = "Your account needs to be activated."
    email_from = settings.EMAIL_HOST_USER
    message = F'Hi, Your account has been created. Click on the link to activate your account {current_site}/activate_email/{email_token}'

    send_mail(subject, message , email_from , [email])


def send_password_reset_email( email , password_reset_token, current_site):
    subject = "Your Password Reset Link."
    email_from = settings.EMAIL_HOST_USER
    message = F'Hi, It is your password link. Click on the link to reset your password {current_site}/password_reset/{password_reset_token}'

    send_mail(subject, message , email_from , [email])