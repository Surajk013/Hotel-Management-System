-- Database: hotel_management

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
     role ENUM('guest','staff','admin') DEFAULT 'guest'
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_type ENUM('single', 'double', 'suite') NOT NULL,
    room_number INT NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    is_available ENUM('available', 'occupied') DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);


-- Insert some initial guests
INSERT INTO users  (id,username, password,role) VALUES
(1,'guest1', 'password123','guest'),
(2,'guest', 'password','guest'),
(3,'suraj', 'pword','guest'),
(4,'varun', 'pass','guest'),
(5,'karan', 'pass123','guest'),
(6,'staff1','staffpass','staff'),
(7,'staff','staffpass','staff'),
(8,'vikas','staffpass','staff'),
(9,'rahul','staffpass','staff'),
(10,'admin','ooo','admin'),
(11,'boss','8055','admin');

-- Inserting Sample Rooms
INSERT INTO rooms (room_type, room_number, price) VALUES
('single', 101, 100.00),
('single', 102, 100.00),
('single', 103, 11805.29),
('single', 104, 23106.98),
('single', 105, 30634.49),
('single', 106, 18686.7),
('single', 107, 2610.6),
('single', 108, 21338.92),
('single', 109, 11777.28),
('single', 110, 6144.20),
('single', 111, 9281.16),
('single', 112, 31582.88),
('single', 113, 209.88),
('single', 114, 9476.90),
('single', 115, 806.23),
('single', 116, 13746.51),
('single', 117, 17410.48),
('single', 118, 577.61),
('single', 119, 449.6),
('single', 120, 79.70),
('single', 121, 606.59),
('single', 122, 555.81),
('single', 123, 841.40),
('single', 124, 476.71),
('single', 125, 489.88),
('single', 126, 522.69),
('single', 127, 143.56),
('single', 128, 545.8),
('single', 129, 967.6),
('single', 130, 515.87),
('single', 131, 38.58),
('single', 132, 189.60),
('single', 133, 717.75),
('single', 134, 349.82),
('single', 135, 902.73),
('double', 201, 150.00),
('double', 202, 150.00),
('double', 203, 30006.66),
('double', 204, 16497.43),
('double', 205, 5428.17),
('double', 206, 27273.39),
('double', 207, 6792.27),
('double', 208, 17117.93),
('double', 209, 16925.11),
('double', 210, 25348.22),
('double', 211, 16696.23),
('double', 212, 6063.25),
('double', 213, 1253.15),
('double', 214, 17004.66),
('double', 215, 19353.87),
('double', 216, 24746.59),
('double', 217, 8964.34),
('double', 218, 6709.18),
('double', 219, 27500.59),
('double', 220, 3600.28),
('double', 221, 23165.97),
('double', 222, 19460.89),
('double', 223, 8507.54),
('double', 224, 15148.97),
('double', 225, 14629.65),
('double', 226, 20514.1),
('double', 227, 8407.86),
('double', 228, 9422.68),
('double', 229, 3024.66),
('double', 230, 17877.50),
('double', 231, 1215.82),
('double', 232, 6100.81),
('double', 233, 31202.38),
('double', 234, 2873.96),
('double', 235, 24947.38),
('suite', 301, 250.00),
('suite', 302, 250.00),
('double', 303, 6441.6),
('double', 304, 32667.91),
('double', 305, 30038.37),
('double', 306, 15913.29),
('double', 307, 27998.53),
('double', 308, 22866.89),
('double', 309, 23815.64),
('double', 310, 12269.44),
('double', 311, 15594.64),
('double', 312, 33254.5),
('double', 313, 8114.86),
('double', 314, 10977.9),
('double', 315, 9055.50),
('double', 316, 6576.43),
('double', 317, 30807.72),
('double', 318, 8754.23),
('double', 319, 37748.39),
('double', 320, 17787.70),
('double', 321, 21412.40),
('double', 322, 27772.9),
('double', 323, 33308.49),
('double', 324, 6188.0),
('double', 325, 6005.43),
('double', 326, 8609.16),
('double', 327, 26095.85),
('double', 328, 7893.53),
('double', 329, 33585.59),
('double', 330, 15953.69),
('double', 331, 11942.55),
('double', 332, 29072.79),
('double', 333, 27105.7),
('double', 334, 32229.9),
('double', 335, 31480.21);
