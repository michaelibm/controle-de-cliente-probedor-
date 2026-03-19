import { Injectable, NotFoundException } from '@nestjs/common';
import { InstallationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { paginate } from '../../common/dto/pagination.dto';
import { format } from 'date-fns';

@Injectable()
export class InstallationsService {
  constructor(private prisma: PrismaService, private webhook: WebhookService) {}

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.installation.count({
      where: { code: { startsWith: `OS-${year}` } },
    });
    return `OS-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: {
    customerId: string;
    planId?: string;
    technicianId?: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
  }) {
    const code = await this.generateCode();

    // Snapshot the customer address at creation time
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: { address: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : null;

    const technician = dto.technicianId
      ? await this.prisma.user.findUnique({ where: { id: dto.technicianId }, select: { id: true, name: true } })
      : null;

    const addressSnapshot = customer.address
      ? {
          street: customer.address.street,
          number: customer.address.number,
          complement: customer.address.complement,
          neighborhood: customer.address.neighborhood,
          city: customer.address.city,
          state: customer.address.state,
          zipCode: customer.address.zipCode,
          reference: customer.address.reference,
        }
      : null;

    const installation = await this.prisma.installation.create({
      data: {
        code,
        customerId: dto.customerId,
        planId: dto.planId,
        technicianId: dto.technicianId,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledTime: dto.scheduledTime,
        notes: dto.notes,
        addressSnapshot: addressSnapshot ?? Prisma.JsonNull,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, whatsapp: true } },
        plan: { select: { id: true, name: true, downloadSpeed: true, uploadSpeed: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    // Send webhook to n8n
    this.webhook.send('installation.created', {
      installationId: installation.id,
      code: installation.code,
      customerName: customer.name,
      customerPhone: customer.whatsapp || customer.phone,
      address: addressSnapshot
        ? `${addressSnapshot.street}, ${addressSnapshot.number}${addressSnapshot.complement ? ` - ${addressSnapshot.complement}` : ''}, ${addressSnapshot.neighborhood}, ${addressSnapshot.city} - ${addressSnapshot.state}`
        : null,
      planName: plan?.name,
      planSpeed: plan ? `${plan.downloadSpeed}Mbps` : null,
      scheduledDate: format(new Date(dto.scheduledDate), 'dd/MM/yyyy'),
      scheduledTime: dto.scheduledTime,
      technicianName: technician?.name,
    });

    return installation;
  }

  async findAll(filters: {
    status?: string;
    technicianId?: string;
    customerId?: string;
    dateStart?: string;
    dateEnd?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 25 } = filters;
    const skip = (page - 1) * limit;

    const statusList = filters.status
      ? (filters.status.split(',') as InstallationStatus[])
      : undefined;

    const where: Prisma.InstallationWhereInput = {
      ...(statusList && { status: { in: statusList } }),
      ...(filters.technicianId && { technicianId: filters.technicianId }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.search && {
        customer: { name: { contains: filters.search, mode: 'insensitive' } },
      }),
      ...((filters.dateStart || filters.dateEnd) ? {
        scheduledDate: {
          ...(filters.dateStart && { gte: new Date(filters.dateStart) }),
          ...(filters.dateEnd && { lte: new Date(filters.dateEnd) }),
        },
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.installation.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true, whatsapp: true } },
          plan: { select: { id: true, name: true, downloadSpeed: true, uploadSpeed: true } },
          technician: { select: { id: true, name: true } },
        },
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
      }),
      this.prisma.installation.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const inst = await this.prisma.installation.findUnique({
      where: { id },
      include: {
        customer: { include: { address: true } },
        plan: true,
        technician: { select: { id: true, name: true } },
      },
    });
    if (!inst) throw new NotFoundException('Instalação não encontrada');
    return inst;
  }

  async updateStatus(id: string, status: InstallationStatus) {
    await this.findOne(id);
    return this.prisma.installation.update({
      where: { id },
      data: {
        status,
        ...(status === InstallationStatus.DONE ? { completedAt: new Date() } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
    });
  }

  async assignTechnician(id: string, technicianId: string) {
    await this.findOne(id);
    return this.prisma.installation.update({
      where: { id },
      data: { technicianId },
      include: { technician: { select: { id: true, name: true } } },
    });
  }

  async getTechnicians() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['INSTALLER', 'SUPPORT', 'ADMIN'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
