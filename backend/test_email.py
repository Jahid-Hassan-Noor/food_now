#!/usr/bin/env python
"""
Email diagnostic script for Food_now backend
This will help identify why emails are not being received.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.mail import send_mail
from core.settings import EMAIL_HOST_USER, EMAIL_HOST, EMAIL_PORT


def test_smtp_connection():
    """Test raw SMTP connection"""
    print("=" * 60)
    print("Testing SMTP Connection")
    print("=" * 60)
    print(f"EMAIL_HOST: {EMAIL_HOST}")
    print(f"EMAIL_PORT: {EMAIL_PORT}")
    print(f"EMAIL_HOST_USER: {EMAIL_HOST_USER}")
    print()
    
    try:
        import smtplib
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10)
        server.set_debuglevel(1)  # Show SMTP conversation
        server.ehlo()
        server.starttls()
        server.ehlo()
        
        # Try to login
        from core.settings import EMAIL_HOST_PASSWORD
        print(f"\nAttempting login with password: {'*' * len(EMAIL_HOST_PASSWORD)}")
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        
        print("\n✅ SMTP LOGIN SUCCESSFUL!")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ SMTP AUTHENTICATION FAILED!")
        print(f"Error: {e}")
        print("\n🔧 SOLUTION:")
        print("  For Gmail, you need to:")
        print("  1. Enable 2-Step Verification on your Google account")
        print("  2. Generate an App Password at: https://myaccount.google.com/apppasswords")
        print("  3. Use the 16-character app password (not your regular password)")
        return False
    except Exception as e:
        print(f"\n❌ CONNECTION FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")
        return False


def test_django_email():
    """Test Django email sending"""
    print("\n" + "=" * 60)
    print("Testing Django Email Sending")
    print("=" * 60)
    
    test_recipient = input("Enter your email address to receive test email: ").strip()
    
    if not test_recipient:
        print("❌ No email address provided, skipping Django test")
        return
    
    try:
        result = send_mail(
            subject='Test Email from Food_now Backend',
            message='If you receive this, your email configuration is working correctly!',
            from_email=EMAIL_HOST_USER,
            recipient_list=[test_recipient],
            fail_silently=False,  # Raise exceptions instead of hiding them
        )
        
        if result == 1:
            print(f"\n✅ EMAIL SENT SUCCESSFULLY to {test_recipient}!")
            print("   Check your inbox (and spam folder)")
        else:
            print(f"\n⚠️  Email send returned {result} (expected 1)")
    except Exception as e:
        print(f"\n❌ EMAIL SEND FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")


def check_email_functions():
    """Check the email functions for error handling"""
    print("\n" + "=" * 60)
    print("Checking Email Functions")
    print("=" * 60)
    
    print("\n⚠️  ISSUE FOUND:")
    print("   The email functions in core/emails.py do NOT have error handling!")
    print("   If send_mail() fails, the error is silently ignored.")
    print()
    print("   Location: admin_app/views/account.py, line 62")
    print("   The forgot_password view calls send_password_reset_email()")
    print("   but doesn't catch exceptions, so failures are invisible.")
    print()
    print("🔧 RECOMMENDATION:")
    print("   Add try-except blocks around send_mail() calls to log errors")


if __name__ == "__main__":
    print("Food_now Email Diagnostic Tool")
    print("=" * 60)
    
    # Test 1: SMTP Connection
    smtp_ok = test_smtp_connection()
    
    # Test 2: Django Email (only if SMTP works)
    if smtp_ok:
        test_django_email()
    else:
        print("\n⏭️  Skipping Django email test (fix SMTP authentication first)")
    
    # Test 3: Check code for issues
    check_email_functions()
    
    print("\n" + "=" * 60)
    print("Diagnostic Complete")
    print("=" * 60)
