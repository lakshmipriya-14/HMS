import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Scoped } from '../common/decorators/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@Scoped()
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(@CurrentUser('id') userId: string) {
    const data = await this.service.getUserNotifications(userId);
    return {
      message: 'Notifications retrieved',
      data,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.service.markAsRead(id, userId);
    return {
      message: 'Notification marked as read',
    };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.service.markAllAsRead(userId);
    return {
      message: 'All notifications marked as read',
    };
  }
}
