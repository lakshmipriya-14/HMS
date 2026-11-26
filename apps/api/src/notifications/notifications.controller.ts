import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto } from '@multispeciality-hms/contracts';

@ApiTags('Notifications')
@Controller('notifications')
@Scoped()
@UseGuards(RolesGuard)
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.service.deleteNotification(id, userId);
    return {
      message: 'Notification deleted',
    };
  }

  @Post('broadcast')
  @RequirePermissions('NOTIFICATIONS:VIEW')
  @ApiOperation({ summary: 'Broadcast hospital announcement or operational notice' })
  async broadcastAnnouncement(
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { title: string; message: string; targetRole?: string; branchId?: string }
  ) {
    const data = await this.service.broadcastAnnouncement(actor, dto);
    return {
      message: `Announcement broadcast to ${data.createdCount} hospital staff`,
      data,
    };
  }
}
