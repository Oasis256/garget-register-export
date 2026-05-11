ALTER TABLE `assets` MODIFY COLUMN `category` enum('smartphone','laptop','tablet','vehicle','motorcycle','bicycle','camera','television','generator','refrigerator','washing_machine','audio_system','printer','projector','power_tools','solar_system','agri_equipment','medical_equipment','high_value_item','other_electronics','desktop','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `partType` varchar(64);--> statement-breakpoint
ALTER TABLE `assets` ADD `partLabel` varchar(256);--> statement-breakpoint
ALTER TABLE `assets` ADD `vin` varchar(64);--> statement-breakpoint
ALTER TABLE `assets` ADD `plateNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `assets` ADD `yearOfManufacture` int;