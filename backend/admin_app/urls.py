# admin_app/urls.py


from django.urls import path
from admin_app.views import *


urlpatterns = [

	path('announcements/', Announcements.as_view()),
	path('available_subscriptions/', AvailableSubscriptions.as_view()),
	path('chefs/', Chefs.as_view()),
	path('admin_dashboard/', AdminDashboard.as_view()),
	path('admin_dashboard/export/', AdminDashboardExport.as_view()),
	path('dashboard_export/', AdminDashboardExport.as_view()),
	path('admin_dashboard/report_schedule/', DashboardReportScheduleView.as_view()),
	path('settings/', AppSettings.as_view()),
	path('subscriptions/', SubscriptionOptionListCreate.as_view()),
	path('subscriptions/<int:pk>/', SubscriptionOptionDetail.as_view()),
	path('subscriptions/pending/', AdminSubscriptionPending.as_view()),
	path('subscriptions/pending/<str:pending_id>/', AdminSubscriptionPendingDetail.as_view()),
	path('subscriptions/history/', AdminSubscriptionHistory.as_view()),
	path('transactions/', Transactions.as_view()),
	path('user_feedbacks/', UserFeedbacksAdmin.as_view()),
	path('user_feedbacks/<str:feedback_id>/', UserFeedbacksAdminDetail.as_view()),
	path('users/', UsersList.as_view()),
]
