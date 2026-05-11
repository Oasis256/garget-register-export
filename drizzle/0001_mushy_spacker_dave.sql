CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`parentId` int,
	`category` enum('smartphone','laptop','tablet','vehicle','motorcycle','bicycle','camera','tv','generator','other') NOT NULL,
	`label` varchar(256) NOT NULL,
	`make` varchar(128),
	`model` varchar(128),
	`color` varchar(64),
	`serialNumber` varchar(256),
	`imei` varchar(20),
	`qrPublicId` varchar(64),
	`qrSecretHash` varchar(128),
	`status` enum('active','stolen','pending','retired','disputed') NOT NULL DEFAULT 'active',
	`proofFileKey` text,
	`proofFileSha256` varchar(64),
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_qrPublicId_unique` UNIQUE(`qrPublicId`)
);
--> statement-breakpoint
CREATE TABLE `fraud_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectType` enum('user','asset','scan') NOT NULL,
	`subjectId` int NOT NULL,
	`flagType` varchar(64) NOT NULL,
	`riskScore` int NOT NULL DEFAULT 0,
	`description` text,
	`status` enum('open','reviewed','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraud_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `law_enforcement_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` varchar(64) NOT NULL,
	`agency` varchar(128) NOT NULL DEFAULT 'Uganda Police Force',
	`jurisdiction` varchar(128),
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `law_enforcement_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `law_enforcement_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('scan_alert','stolen_alert','verification_request','transfer_request','transfer_confirmed','report_activated','report_resolved','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`data` json DEFAULT ('{}'),
	`isRead` boolean NOT NULL DEFAULT false,
	`channel` enum('push','sms','email','in_app') NOT NULL DEFAULT 'in_app',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ownership_intervals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`releasedAt` timestamp,
	`acquisitionMethod` enum('purchase','gift','manufacture','transfer','other') NOT NULL DEFAULT 'purchase',
	`isCurrent` boolean NOT NULL DEFAULT true,
	`evidenceFileKey` text,
	`evidenceFileSha256` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ownership_intervals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`priceUgx` int NOT NULL DEFAULT 0,
	`billingPeriod` enum('monthly','yearly','once') NOT NULL DEFAULT 'yearly',
	`assetLimit` int NOT NULL DEFAULT 2,
	`userLimit` int NOT NULL DEFAULT 1,
	`features` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `stolen_evidence_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stolenReportId` int NOT NULL,
	`fileKey` text NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`mimeType` varchar(128),
	`originalName` varchar(256),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stolen_evidence_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stolen_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`reporterUserId` int NOT NULL,
	`reportBasis` enum('police_report','witness_signatures','self_report') NOT NULL DEFAULT 'police_report',
	`policeCaseNumber` varchar(64),
	`upfCaseNumber` varchar(64),
	`uccBlacklistStatus` enum('not_submitted','processing','blacklisted','failed') NOT NULL DEFAULT 'not_submitted',
	`status` enum('draft','submitted','verified','active','resolved','revoked','disputed') NOT NULL DEFAULT 'draft',
	`lastKnownLat` decimal(10,7),
	`lastKnownLng` decimal(10,7),
	`lastKnownAt` timestamp,
	`description` text,
	`submittedAt` timestamp,
	`activatedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stolen_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transfer_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`fromOwnerUserId` int NOT NULL,
	`toOwnerUserId` int,
	`toUserNin` varchar(30),
	`initiatedByUserId` int NOT NULL,
	`status` enum('pending','confirmed','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`transferType` enum('sale','gift','inheritance','other') NOT NULL DEFAULT 'sale',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transfer_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`buyerUserId` int,
	`scanChannel` enum('qr','imei','serial','manual') NOT NULL DEFAULT 'qr',
	`scanToken` varchar(128),
	`scannerRisk` enum('normal','high_velocity','blocked') NOT NULL DEFAULT 'normal',
	`geoBucket` varchar(32),
	`requestStatus` enum('created','delivered','approved','rejected','expired','cancelled') NOT NULL DEFAULT 'created',
	`resultCode` enum('CLEAN','STOLEN','PENDING','UNVERIFIED'),
	`receiptPayload` json,
	`receiptSha256` varchar(64),
	`expiresAt` timestamp,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warrant_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`officerUserId` int NOT NULL,
	`warrantNumber` varchar(64) NOT NULL,
	`warrantType` enum('asset_lookup','identity_subpoena','evidence_export') NOT NULL,
	`targetRef` varchar(256),
	`status` enum('pending','approved','executed','expired') NOT NULL DEFAULT 'pending',
	`issuedAt` timestamp,
	`expiresAt` timestamp,
	`scope` json DEFAULT ('{}'),
	`caseLog` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warrant_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','buyer','law_enforcement','admin') NOT NULL DEFAULT 'owner';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `nin` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD `ninVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended','banned') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `planId` int;