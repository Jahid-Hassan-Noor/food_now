# from django import template
# from datetime import date
# from user_app.models import Shortlink_history
# from admin_app.models import Shortlink
# from django.db.models import Q

# register = template.Library()

# @register.simple_tag(name="shortlink_claims_left")
# def shortlink_claims_left_tag(shortlink_uid, user_uid):
#     today = date.today()
#     try:
#         shortlink_history = Shortlink_history.objects.get( Q(user_uid = user_uid) & Q(shortlink_claim_time__date = today) & Q(shortlink_uid = shortlink_uid) )
#         claims_left = shortlink_history.claims_left
#     except Exception as e:
#         shortlink = Shortlink.objects.get(uid = shortlink_uid)
#         claims_left = shortlink.max_claim_per_day
#     return claims_left