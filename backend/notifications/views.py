# notifications/views.py


from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponseRedirect, HttpResponse
from home_app.models import *
from notifications.models import *

# Create your views here.
@staff_member_required(login_url='error500')
def send_notification_to_all(request):
    all_users = User.objects.all()

    if request.method == 'POST':
        title = request.POST.get('title')
        message = request.POST.get('message')

        for user in all_users:

            username = user.username

            # Create new notification
            create_new_notification = Notification( 
                sender = "Admin",
                username = username,
                title = title,
                message = message,
                )
            create_new_notification.save()

        messages.success(request, "Send Successfully.")
        return HttpResponseRedirect(request.path_info)

    return render(request , "manager/notifications_to_all.html")


@staff_member_required(login_url='error500')
def send_notification_to_chefs(request):
    all_chefs = Profile.objects.filter( role = "Chef" )
    if not all_chefs.exists():
        messages.error(request, "No chefs found.")
        return redirect("manager_send_notifications")

    if request.method == 'POST':
        title = request.POST.get('title')
        country = request.POST.get('country')
        message = request.POST.get('message')


        try:
            for user in all_chefs:
                username = user.user.username

                # Create new notification
                create_new_notification = Notification( 
                    sender = "Admin",
                    username = username,
                    title = title,
                    message = message,
                    )
                create_new_notification.save()

        except Exception as e:
            print(e)

        messages.success(request, "Send Successfully.")
        return HttpResponseRedirect(request.path_info)


    return render(request , "manager/notifications_to_chefs.html")


@staff_member_required(login_url='error500')
def send_notification_to_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        title = request.POST.get('title')
        message = request.POST.get('message')

        #Create new notification
        create_new_notification = Notification( 
            sender = "Admin",
            username = username,
            title = title,
            message = message,
            )
        create_new_notification.save()

        messages.success(request, "Send Successfully.")
        return HttpResponseRedirect(request.path_info)

    return render(request , "manager/notifications_to_user.html")