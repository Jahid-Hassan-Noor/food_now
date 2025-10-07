# home_app/views.py


from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, HttpResponse
from admin_app.models import Profile, Setting, send_password_reset_email
import uuid
from datetime import datetime, timedelta
from user_app.models import Campaign
from django.db.models import Q

# Create your views here.


                        #  Home View 

def home(request):

    # Getting Features for Home Page
    # available_now = Campaign.objects.filter(Q(status="active") & Q(start_time__lte=datetime.now()) & Q(end_time__gte=datetime.now()) & Q(quantity_available__gte=0)).order_by('-start_time')

    # context = { 
    #             'available_now': available_now,
    #            }
        
    # return render(request , "home/index.html", context)

    return HttpResponse("This is the home page. Available now feature is commented out for now.")



                        # Password Reset Views
# # Password Reset View
# def password_reset(request):
#     if request.method == 'POST':
#         email = request.POST.get('email')

#         email_check = User.objects.filter(email=email)
#         if not email_check.exists():
#             messages.error(request, "Account not Found.")
#             return HttpResponseRedirect(request.path_info)

#         user = User.objects.get( email = email)
#         user_id = user.pk
#         profile = Profile.objects.get( user = user_id )
#         user_uid = profile.uid
#         current_site = Site.objects.get_current()
#         try:
#             password_reset_token = str(uuid.uuid4())[:20]
#             Profile.objects.filter( uid = user_uid ).update( 

#                 password_reset_token = password_reset_token,

#             )
#             send_password_reset_email(email, password_reset_token, current_site)
#             messages.success(request, "Email sent successfully.")
#             return HttpResponseRedirect(request.path_info)
#         except Exception as e:
#             print(e)
#             return HttpResponse("Email address not found.")

#     return render(request , "home/password_reset.html")



# def reset_your_password(request, password_reset_token):
#     userprofile = Profile.objects.get(password_reset_token = password_reset_token)
#     user = User.objects.get(username = userprofile)
#     fm = SetPasswordForm( user = user)
#     if request.method == 'POST':
#         fm = SetPasswordForm(user = user , data = request.POST)
#         if fm.is_valid():
#             fm.save()
#             messages.success(request, "Your Password was reset successfully.")
#             return redirect('/')
#     return render(request , "home/change_password.html", {"form" : fm})