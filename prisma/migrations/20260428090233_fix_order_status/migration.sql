/*
  Warnings:

  - The values [SHIPPED] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
