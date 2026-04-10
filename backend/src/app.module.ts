import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PlansModule } from './modules/plans/plans.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ReceivablesModule } from './modules/receivables/receivables.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { PayablesModule } from './modules/payables/payables.module';
import { FinancialModule } from './modules/financial/financial.module';
import { InstallationsModule } from './modules/installations/installations.module';
import { AsaasModule } from './modules/asaas/asaas.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    PlansModule,
    ContractsModule,
    ReceivablesModule,
    DashboardModule,
    HealthModule,
    WebhookModule,
    PayablesModule,
    FinancialModule,
    InstallationsModule,
    AsaasModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
