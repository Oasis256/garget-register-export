CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planCode` varchar(32) NOT NULL,
	`amountUgx` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'UGX',
	`txRef` varchar(128) NOT NULL,
	`flwRef` varchar(128),
	`flwTransactionId` varchar(64),
	`provider` enum('MTN','AIRTEL','CARD','MANUAL') NOT NULL,
	`phone` varchar(20) NOT NULL,
	`status` enum('pending','processing','successful','failed','cancelled') NOT NULL DEFAULT 'pending',
	`redirectUrl` text,
	`webhookPayload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_txRef_unique` UNIQUE(`txRef`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planCode` varchar(32) NOT NULL DEFAULT 'FREE',
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`lastPaymentId` int,
	`assetLimit` int NOT NULL DEFAULT 2,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
