import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNursingTaskDto, RecordVitalsDto } from '@multispeciality-hms/contracts';

@Injectable()
export class NursingService {
  constructor(private prisma: PrismaService) {}

  async getAssignedPatients() {
    return this.prisma.admission.findMany({
      where: { status: 'ADMITTED' },
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            allergies: true,
          },
        },
        ward: true,
        bed: true,
        admittingDoctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        vitals: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        nursingTasks: {
          where: { isCompleted: false },
        },
      },
      orderBy: { admittedAt: 'desc' },
    });
  }

  async recordVitals(dto: RecordVitalsDto, userId: string) {
    // Check if vitals are abnormal
    let isAbnormal = false;
    if (dto.temperature && (dto.temperature > 99.5 || dto.temperature < 96.0)) isAbnormal = true;
    if (dto.systolicBp && (dto.systolicBp > 140 || dto.systolicBp < 90)) isAbnormal = true;
    if (dto.diastolicBp && (dto.diastolicBp > 90 || dto.diastolicBp < 60)) isAbnormal = true;
    if (dto.pulseRate && (dto.pulseRate > 100 || dto.pulseRate < 55)) isAbnormal = true;
    if (dto.oxygenSaturation && dto.oxygenSaturation < 95) isAbnormal = true;
    if (dto.bloodSugarMgDl && (dto.bloodSugarMgDl > 200 || dto.bloodSugarMgDl < 70)) isAbnormal = true;

    const vitals = await this.prisma.vitalsRecord.create({
      data: {
        patientId: dto.patientId,
        admissionId: dto.admissionId,
        recordedByUserId: userId,
        temperature: dto.temperature,
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        pulseRate: dto.pulseRate,
        respiratoryRate: dto.respiratoryRate,
        oxygenSaturation: dto.oxygenSaturation,
        bloodSugarMgDl: dto.bloodSugarMgDl,
        weightKg: dto.weightKg,
        heightCm: dto.heightCm,
        isAbnormal,
        notes: dto.notes,
      },
    });

    return vitals;
  }

  async getTasks(admissionId?: string) {
    return this.prisma.nursingTask.findMany({
      where: {
        ...(admissionId ? { admissionId } : {}),
      },
      orderBy: [{ isCompleted: 'asc' }, { dueTime: 'asc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
      },
    });
  }

  async createTask(dto: CreateNursingTaskDto) {
    return this.prisma.nursingTask.create({
      data: {
        patientId: dto.patientId,
        admissionId: dto.admissionId,
        taskTitle: dto.taskTitle,
        taskDescription: dto.taskDescription,
        dueTime: new Date(dto.dueTime),
        priority: dto.priority || 'ROUTINE',
      },
    });
  }

  async updateTaskStatus(taskId: string, isCompleted: boolean) {
    return this.prisma.nursingTask.update({
      where: { id: taskId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  async administerMedication(data: { prescriptionItemId: string; admissionId: string; dose: string; notes?: string }, nurseId: string) {
    return this.prisma.medicationAdministration.create({
      data: {
        prescriptionItemId: data.prescriptionItemId,
        admissionId: data.admissionId,
        nurseId,
        administeredDose: data.dose,
        notes: data.notes,
      },
    });
  }
}
