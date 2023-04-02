CREATE DATABASE  IF NOT EXISTS `cpanel`;
USE `cpanel`;
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(1000) NOT NULL,
  `access` int NOT NULL DEFAULT '0',
  `lastlogin` datetime DEFAULT NULL,
  `passwordreset` varchar(45) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES `accounts` WRITE;
/* Password is changeme */
INSERT INTO `accounts` VALUES (1,'UPDATE_TO_YOUR_EMAIL_ADDRESS','L0097c4f84436c9a123606360d4464fcf8ba7b4ea0634f5e904ec8a6a7f37e1c8ca944439aa072588bd7dc951275106d4a6131d406297197e3a8f4b7a379c7511Aac888dba5cf41638da24e5889ab78f7536162bb5b0f09d475175adb07493109cPf1891cea80fc05e433c943254c6bdabc159577a02a7395dfebbfbc4f7661d4af56f2d372131a45936de40160007368a56ef216a30cb202c66d3145fd24380906Y3346b0b709ea6acf65dc1f9b5a2ed4aaad7311e76f3b1e80ec56d619bf5bb12cX',1,NULL,'1');
UNLOCK TABLES;
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session` varchar(1000) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `code` varchar(6) NOT NULL DEFAULT '0',
  `created` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES `sessions` WRITE;
UNLOCK TABLES;
DROP TABLE IF EXISTS `allowed_ips`;
CREATE TABLE `allowed_ips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
  PRIMARY KEY (`ip`),
  UNIQUE KEY `ip_UNIQUE` (`ip`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES `allowed_ips` WRITE;
UNLOCK TABLES;
DROP TABLE IF EXISTS `blocked_ips`;
CREATE TABLE `blocked_ips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
  PRIMARY KEY (`ip`),
  UNIQUE KEY `ip_UNIQUE` (`ip`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;