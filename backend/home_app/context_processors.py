# # home/context_processors.py

# from home_app.models import Withdrawal, Ads_code, Setting, Profile
# from notifications.models import Notification
# from admin_app.models import Payment_request
# from user_app.models import Faucet_history
# from user_app.views.views_common_functions import convert_userdata_in_MK
# from django.db.models import Q

# def website_details(request):

#     users = Profile.objects.all()
#     total_users = len(list(users))
#     manual_faucet_claimed = Faucet_history.objects.all()
#     total_manual_faucet_claimed = len(list(manual_faucet_claimed))
#     total_faucet_claimed = total_manual_faucet_claimed
#     withdrawals = Withdrawal.objects.all()
#     total_withdrawals = len(list(withdrawals))
#     notifications = 0
#     manager_notifications = 0

#     try:
#         profile = Profile.objects.get(user = request.user)
#         username = profile.user
#         notifications_list = Notification.objects.filter( Q(username = username) & Q(is_seen = False) )
#         notifications = len(list(notifications_list))
#         if notifications > 9:
#             notifications = "9+"

#     except Exception as e:
#         pass

#     try:
#         manager_notifications_list = Payment_request.objects.all()
#         manager_notifications = len(list(manager_notifications_list))
#         if manager_notifications > 9:
#             manager_notifications = "9+"

#     except Exception as e:
#         pass


#     # Getting Settings 
#     website_name_setting = Setting.objects.get( setting_name = "website_name" )
#     website_description_setting = Setting.objects.get( setting_name = "website_description" )
#     anti_adblocker_setting = Setting.objects.get( setting_name = "anti_adblocker" )
#     website_status_setting = Setting.objects.get( setting_name = "website_status" )
#     website_total_tokens_claimed_setting = Setting.objects.get( setting_name = "website_total_tokens_claimed" )
#     total_paid_setting = Setting.objects.get( setting_name = "total_paid" )

#     # Getting Ad-codes 
#     website_top_ad_setting = Ads_code.objects.get( code_tag = "website_top" )
#     website_footer_ad_setting = Ads_code.objects.get( code_tag = "website_footer" )


#     # Converting Settings Value 
#     website_name = website_name_setting.setting_value
#     website_description = website_description_setting.setting_value
#     anti_adblocker = anti_adblocker_setting.setting_value
#     website_status = website_status_setting.setting_value
#     total_paid = float(total_paid_setting.setting_value)
#     total_paid_amount = convert_userdata_in_MK(total_paid)
#     website_total_withdrawals = convert_userdata_in_MK(total_withdrawals)
#     website_total_users = convert_userdata_in_MK(total_users)
#     website_total_tokens_claimed = convert_userdata_in_MK(float(website_total_tokens_claimed_setting.setting_value))
#     website_total_faucet_claimed = convert_userdata_in_MK(total_faucet_claimed)

#     # Converting SAd-codes Value 
#     website_top_ad = website_top_ad_setting.ads_code
#     website_footer_ad = website_footer_ad_setting.ads_code

#     return { 
#             'website_name' : website_name,
#             'website_description' : website_description,
#             'anti_adblocker' :anti_adblocker,
#             'website_status' :website_status,
#             'website_total_users': website_total_users,
#             'total_withdrawals': website_total_withdrawals,
#             'total_paid_amount': total_paid_amount,
#             'website_total_tokens_claimed': website_total_tokens_claimed,
#             'website_total_faucet_claimed': website_total_faucet_claimed,
#             'notifications_count': notifications,
#             'manager_notifications_count': manager_notifications,
#             'website_top_ad': website_top_ad,
#             'website_footer_ad': website_footer_ad,
        
#         }