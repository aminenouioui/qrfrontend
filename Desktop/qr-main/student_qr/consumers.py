from channels.generic.websocket import AsyncWebsocketConsumer
import json

class AttendanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("attendance_group", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("attendance_group", self.channel_name)

    async def attendance_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'attendance_update',
            'studentId': event['studentId'],
            'scheduleId': event['scheduleId'],
            'date': event['date'],
            'status': event['status'].lower()  # Normalize status to lowercase
        }))