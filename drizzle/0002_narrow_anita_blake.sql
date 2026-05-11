ALTER TABLE `assets` MODIFY COLUMN `metadata` json;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `data` json;--> statement-breakpoint
ALTER TABLE `plans` MODIFY COLUMN `features` json;--> statement-breakpoint
ALTER TABLE `warrant_records` MODIFY COLUMN `scope` json;--> statement-breakpoint
ALTER TABLE `warrant_records` MODIFY COLUMN `caseLog` json;