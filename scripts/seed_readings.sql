INSERT INTO sensor_readings (time, device_id, temperature, humidity, battery_level, solar_power_watts, compressor_state, door_state, cooling_cycle_duration) VALUES
(NOW(), '21a279cd-6e88-4957-876d-745ca1f8663a', -2.5, 65.3, 88.1, 210.5, true, false, 45),
(NOW() - INTERVAL '5 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -1.8, 62.1, 87.5, 195.2, true, false, 38),
(NOW() - INTERVAL '10 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -3.1, 68.7, 86.9, 180.0, false, false, 30),
(NOW() - INTERVAL '15 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -0.5, 70.2, 86.2, 250.3, true, false, 52),
(NOW() - INTERVAL '20 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 1.2, 55.8, 85.8, 275.0, true, true, 28),
(NOW() - INTERVAL '25 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -4.3, 72.1, 85.1, 160.7, false, false, 60),
(NOW() - INTERVAL '30 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -2.0, 66.5, 84.5, 220.1, true, false, 42),
(NOW() - INTERVAL '35 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 0.8, 58.3, 84.0, 290.6, true, false, 35),
(NOW() - INTERVAL '40 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -1.5, 63.9, 83.2, 205.8, false, false, 25),
(NOW() - INTERVAL '45 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -3.8, 71.0, 82.7, 175.3, true, false, 55),
(NOW() - INTERVAL '50 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 2.1, 54.2, 82.0, 300.0, true, false, 22),
(NOW() - INTERVAL '55 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -0.3, 67.8, 81.5, 185.4, false, false, 48),
(NOW() - INTERVAL '60 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -2.9, 69.1, 80.9, 230.2, true, false, 40),
(NOW() - INTERVAL '70 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -4.1, 73.3, 79.8, 150.0, false, false, 58),
(NOW() - INTERVAL '80 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 1.8, 56.2, 78.5, 280.3, true, false, 27),
(NOW() - INTERVAL '90 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -0.8, 66.0, 77.2, 240.1, true, false, 36),
(NOW() - INTERVAL '100 min', '21a279cd-6e88-4957-876d-745ca1f8663a', -2.3, 68.2, 91.0, 200.0, true, false, 41),
(NOW() - INTERVAL '120 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 0.2, 59.8, 90.0, 270.0, true, false, 32),
(NOW() - INTERVAL '150 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 1.0, 57.5, 88.5, 285.0, true, false, 29),
(NOW() - INTERVAL '180 min', '21a279cd-6e88-4957-876d-745ca1f8663a', 2.0, 53.8, 87.0, 298.0, true, false, 24);

UPDATE devices SET last_seen = NOW(), status = 'online' WHERE id = '21a279cd-6e88-4957-876d-745ca1f8663a';
