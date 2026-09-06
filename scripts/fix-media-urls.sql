-- Fix media URLs: change from dead media.jabaridental.com to Worker-served /media path
UPDATE media SET url = REPLACE(url, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE url LIKE 'https://media.jabaridental.com/%';

-- Also fix any image URLs stored as JSON in content tables
UPDATE treatments SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';
UPDATE treatments SET featured_image = REPLACE(featured_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE featured_image LIKE '%media.jabaridental.com%';
UPDATE treatments SET social_image = REPLACE(social_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE social_image LIKE '%media.jabaridental.com%';

UPDATE articles SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';
UPDATE articles SET featured_image = REPLACE(featured_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE featured_image LIKE '%media.jabaridental.com%';
UPDATE articles SET social_image = REPLACE(social_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE social_image LIKE '%media.jabaridental.com%';

UPDATE team SET photo = REPLACE(photo, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE photo LIKE '%media.jabaridental.com%';

UPDATE gallery SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';

UPDATE before_after SET before_image = REPLACE(before_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE before_image LIKE '%media.jabaridental.com%';
UPDATE before_after SET after_image = REPLACE(after_image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE after_image LIKE '%media.jabaridental.com%';

UPDATE testimonials SET photo = REPLACE(photo, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE photo LIKE '%media.jabaridental.com%';

UPDATE offers SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';

UPDATE announcements SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';

UPDATE hero SET image = REPLACE(image, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image LIKE '%media.jabaridental.com%';
UPDATE hero SET image_mobile = REPLACE(image_mobile, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE image_mobile LIKE '%media.jabaridental.com%';
UPDATE hero SET video = REPLACE(video, 'https://media.jabaridental.com/', 'https://jabaridental.com/media/') WHERE video LIKE '%media.jabaridental.com%';
