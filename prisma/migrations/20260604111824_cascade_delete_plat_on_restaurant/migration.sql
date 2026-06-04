-- DropForeignKey
ALTER TABLE `Plat` DROP FOREIGN KEY `Plat_restaurantId_fkey`;

-- DropIndex
DROP INDEX `Plat_restaurantId_fkey` ON `Plat`;

-- AddForeignKey
ALTER TABLE `Plat` ADD CONSTRAINT `Plat_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
