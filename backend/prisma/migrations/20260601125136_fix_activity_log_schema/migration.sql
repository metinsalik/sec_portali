-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employmentType" TEXT,
    "osgbName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "username" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("username","roleId")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "commercialTitle" TEXT,
    "dangerClass" TEXT NOT NULL DEFAULT 'Az Tehlikeli',
    "district" TEXT,
    "email" TEXT,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "fullAddress" TEXT,
    "naceCode" TEXT,
    "phone" TEXT,
    "sgkNumber" TEXT,
    "shortName" TEXT,
    "taxNumber" TEXT,
    "taxOffice" TEXT,
    "type" TEXT,
    "website" TEXT,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentRootCause" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentRootCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentSupportUnit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentSupportUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyCode" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraordinaryIncident" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "rootCauseId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "locationDetail" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "interventionRequired" BOOLEAN NOT NULL,
    "interventionTime" TIMESTAMP(3),
    "controlTime" TIMESTAMP(3) NOT NULL,
    "supportReceived" BOOLEAN NOT NULL,
    "supportUnitId" INTEGER,
    "announcementMade" BOOLEAN NOT NULL,
    "emergencyCodeId" INTEGER,
    "serviceInterrupted" BOOLEAN NOT NULL,
    "interruptionDuration" DOUBLE PRECISION,
    "evacuatedStaffCount" INTEGER NOT NULL DEFAULT 0,
    "evacuatedPatientCount" INTEGER NOT NULL DEFAULT 0,
    "injuredCount" INTEGER NOT NULL DEFAULT 0,
    "deceasedCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "causeDetail" TEXT NOT NULL,
    "detectedEffect" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "actionsTaken" TEXT NOT NULL,
    "resultEvaluation" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attachments" JSONB,

    CONSTRAINT "ExtraordinaryIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "facilityId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "professionalId" INTEGER,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCountHistory" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeCountHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityBuilding" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bedCapacity" INTEGER,
    "buildingFloors" INTEGER,
    "buildingHeight" DOUBLE PRECISION,
    "closedArea" DOUBLE PRECISION,
    "constructionYear" INTEGER,
    "gardenArea" DOUBLE PRECISION,
    "parkingArea" DOUBLE PRECISION,
    "structureFloors" INTEGER,
    "structureHeight" DOUBLE PRECISION,

    CONSTRAINT "FacilityBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFacility" (
    "username" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "UserFacility_pkey" PRIMARY KEY ("username","facilityId")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "osgbName" TEXT,
    "titleClass" TEXT NOT NULL,
    "certificateNo" TEXT,
    "certificateDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerRepresentative" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "EmployerRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OSGBCompany" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "district" TEXT,

    CONSTRAINT "OSGBCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "osgbCompanyId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAmount" DOUBLE PRECISION,
    "calculationDetails" JSONB,
    "difference" DOUBLE PRECISION,
    "invoiceAmount" DOUBLE PRECISION,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "professionalId" INTEGER,
    "employerRepId" INTEGER,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isFullTime" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "costType" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "seriousAccidentDays" INTEGER NOT NULL DEFAULT 4,
    "includeSaturday" BOOLEAN NOT NULL DEFAULT true,
    "dailyWorkHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "monthlyWorkDays" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyHRData" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "mainEmployerData" JSONB NOT NULL,
    "subContractorData" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyHRData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAccidentData" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "mainEmployerData" JSONB NOT NULL,
    "subContractorData" JSONB NOT NULL,
    "internData" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAccidentData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookPage" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Eksik',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentUploadedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotebookPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookItem" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotebookItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmtpSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'SYSTEM',
    "targetRole" TEXT,
    "username" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeFine" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "specialistAndPhysicianVery" DOUBLE PRECISION NOT NULL,
    "specialistAndPhysicianDanger" DOUBLE PRECISION NOT NULL,
    "specialistAndPhysicianLess" DOUBLE PRECISION NOT NULL,
    "dspVeryDangerous" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrativeFine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "module" TEXT NOT NULL,
    "documentNo" TEXT,
    "revisionNo" TEXT,
    "releaseDate" TIMESTAMP(3),
    "content" JSONB NOT NULL,
    "orientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDepartment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowUserRole" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleRole" TEXT NOT NULL,
    "departmentId" INTEGER,
    "reportsTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "WorkflowTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'BEKLIYOR',
    "categoryId" INTEGER,
    "departmentId" INTEGER,
    "createdBy" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "alarmDate" TIMESTAMP(3),
    "isPool" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTaskTag" (
    "taskId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "WorkflowTaskTag_pkey" PRIMARY KEY ("taskId","tagId")
);

-- CreateTable
CREATE TABLE "WorkflowTaskAssignment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ASSIGNEE',
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTaskHistory" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "changedBy" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTaskComment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAlarm" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "alarmDate" TIMESTAMP(3) NOT NULL,
    "alarmType" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "WorkflowAlarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNotificationSettings" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "whatsappNumber" TEXT,
    "notifyOnAssign" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnStatusChange" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnAlarm" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskExpertFacility" (
    "expertUsername" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "RiskExpertFacility_pkey" PRIMARY KEY ("expertUsername","facilityId")
);

-- CreateTable
CREATE TABLE "RiskDepartment" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT,

    CONSTRAINT "RiskDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskLifecycle" (
    "id" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "riskNo" INTEGER NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "subCategory" TEXT,
    "area" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'Fine Kinney',
    "activity" TEXT NOT NULL,
    "hazard" TEXT NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "initialCondition" TEXT,
    "initialImage" TEXT,
    "initialProb" DOUBLE PRECISION NOT NULL,
    "initialFreq" DOUBLE PRECISION,
    "initialSev" DOUBLE PRECISION NOT NULL,
    "initialScore" DOUBLE PRECISION NOT NULL,
    "initialLevel" TEXT NOT NULL,
    "firstActionPlan" TEXT,
    "actionsTaken" TEXT,
    "actionDate" TIMESTAMP(3),
    "actionBy" TEXT,
    "actionImage" TEXT,
    "followUpMeasure" TEXT,
    "extraImprovement" TEXT,
    "finalProb" DOUBLE PRECISION,
    "finalFreq" DOUBLE PRECISION,
    "finalSev" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "finalLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACIK_TEHLIKE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "affectedPeople" TEXT,
    "controlResponsible" TEXT,
    "controlResult" TEXT,
    "detectionDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "effectivenessMethod" TEXT,
    "impactDamage" TEXT,
    "improvementResponsible" TEXT,
    "legislation" TEXT,
    "postImprovementDueDate" TIMESTAMP(3),
    "postImprovementResponsible" TEXT,

    CONSTRAINT "RiskLifecycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAuditLog" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "changedFields" JSONB,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskDepartmentSetting" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskDepartmentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskCategorySetting" (
    "id" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskCategorySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSubCategorySetting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskSubCategorySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCategory_name_key" ON "IncidentCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentRootCause_name_key" ON "IncidentRootCause"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentSupportUnit_name_key" ON "IncidentSupportUnit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyCode_name_key" ON "EmergencyCode"("name");

-- CreateIndex
CREATE INDEX "ExtraordinaryIncident_facilityId_idx" ON "ExtraordinaryIncident"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_facilityId_osgbCompanyId_month_key" ON "Reconciliation"("facilityId", "osgbCompanyId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_year_key" ON "SystemSettings"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyHRData_facilityId_month_key" ON "MonthlyHRData"("facilityId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAccidentData_facilityId_month_key" ON "MonthlyAccidentData"("facilityId", "month");

-- CreateIndex
CREATE INDEX "NotebookPage_facilityId_year_idx" ON "NotebookPage"("facilityId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "NotificationTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConfig_code_key" ON "NotificationConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdministrativeFine_year_key" ON "AdministrativeFine"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_code_version_key" ON "ReportTemplate"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowUserRole_userId_key" ON "WorkflowUserRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNotificationSettings_userId_key" ON "WorkflowNotificationSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskDepartment_facilityId_name_key" ON "RiskDepartment"("facilityId", "name");

-- CreateIndex
CREATE INDEX "RiskLifecycle_departmentId_idx" ON "RiskLifecycle"("departmentId");

-- CreateIndex
CREATE INDEX "RiskAuditLog_riskId_idx" ON "RiskAuditLog"("riskId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskDepartmentSetting_facilityId_name_key" ON "RiskDepartmentSetting"("facilityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RiskCategorySetting_facilityId_name_key" ON "RiskCategorySetting"("facilityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RiskSubCategorySetting_categoryId_name_key" ON "RiskSubCategorySetting"("categoryId", "name");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IncidentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_emergencyCodeId_fkey" FOREIGN KEY ("emergencyCodeId") REFERENCES "EmergencyCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_rootCauseId_fkey" FOREIGN KEY ("rootCauseId") REFERENCES "IncidentRootCause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraordinaryIncident" ADD CONSTRAINT "ExtraordinaryIncident_supportUnitId_fkey" FOREIGN KEY ("supportUnitId") REFERENCES "IncidentSupportUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCountHistory" ADD CONSTRAINT "EmployeeCountHistory_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBuilding" ADD CONSTRAINT "FacilityBuilding_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFacility" ADD CONSTRAINT "UserFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFacility" ADD CONSTRAINT "UserFacility_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_osgbCompanyId_fkey" FOREIGN KEY ("osgbCompanyId") REFERENCES "OSGBCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_employerRepId_fkey" FOREIGN KEY ("employerRepId") REFERENCES "EmployerRepresentative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyHRData" ADD CONSTRAINT "MonthlyHRData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAccidentData" ADD CONSTRAINT "MonthlyAccidentData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookPage" ADD CONSTRAINT "NotebookPage_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookItem" ADD CONSTRAINT "NotebookItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookItem" ADD CONSTRAINT "NotebookItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookItem" ADD CONSTRAINT "NotebookItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "NotebookPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookItem" ADD CONSTRAINT "NotebookItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowUserRole" ADD CONSTRAINT "WorkflowUserRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "WorkflowDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowUserRole" ADD CONSTRAINT "WorkflowUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorkflowCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "WorkflowDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTaskTag" ADD CONSTRAINT "WorkflowTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "WorkflowTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTaskTag" ADD CONSTRAINT "WorkflowTaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTaskAssignment" ADD CONSTRAINT "WorkflowTaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTaskHistory" ADD CONSTRAINT "WorkflowTaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTaskComment" ADD CONSTRAINT "WorkflowTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAlarm" ADD CONSTRAINT "WorkflowAlarm_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotificationSettings" ADD CONSTRAINT "WorkflowNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskExpertFacility" ADD CONSTRAINT "RiskExpertFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskDepartment" ADD CONSTRAINT "RiskDepartment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskLifecycle" ADD CONSTRAINT "RiskLifecycle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "RiskDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAuditLog" ADD CONSTRAINT "RiskAuditLog_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskLifecycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskDepartmentSetting" ADD CONSTRAINT "RiskDepartmentSetting_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskCategorySetting" ADD CONSTRAINT "RiskCategorySetting_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSubCategorySetting" ADD CONSTRAINT "RiskSubCategorySetting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RiskCategorySetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
