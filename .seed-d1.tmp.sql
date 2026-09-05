INSERT OR REPLACE INTO site (id,name,short_name,tagline,location,country,description,brand_primary,brand_accent,logo_text) VALUES ('site', 'JABARI DENTAL', 'JABARI', 'Exceptional dentistry. A better experience.', 'Kampala, Uganda', 'Uganda', 'JABARI DENTAL is a premium dental clinic in Kampala, Uganda, offering modern, comfort-first dentistry designed around your long-term oral health.', '#003C80', '#b08d57', 'JABARI');
INSERT OR REPLACE INTO hero (id,eyebrow,headline,headline_accent,subhead,primary_cta_label,secondary_cta_label,whatsapp_label,status_note,image,image_mobile) VALUES ('hero', 'Premium dental care · Kampala', 'Exceptional dentistry.', 'A better experience.', 'Modern dentistry designed around your comfort, confidence and long-term oral health.', 'Book an Appointment', 'Explore Treatments', 'WhatsApp us', 'Now welcoming new patients', '{"src":"/images/stock/hero.jpg","alt":"Bright, calm dental clinic interior in Kampala","focalX":50,"focalY":40}', '{"src":"/images/stock/hero-mobile.jpg","alt":"Dental clinic reception in warm natural light","focalX":50,"focalY":40}');
INSERT OR REPLACE INTO contact (id,phone,whatsapp,email,maps_url,address_verified,address_note) VALUES ('contact', '256770590299', '256770590299', '', 'https://maps.app.goo.gl/xb75PRmN25xptA1V7', 'Kampala, Uganda', 'Exact street address to be confirmed by the clinic. Tap Get Directions for the verified map location.');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t1', 'general-dentistry', 'General Dentistry', 'Core Care', 'Routine check-ups, preventive care and the everyday dentistry that keeps your smile healthy.', 'Our general dentistry covers comprehensive examinations, professional cleaning, fillings and preventive advice.

We focus on catching issues early and helping you build habits that protect your oral health for the long term.', '◷', '30–60 min', '', 0, '[{"question":"How often should I visit?","answer":"Most patients benefit from a check-up every six months. Your dentist may recommend a different interval based on your needs."}]', '{"src":"/images/stock/treatment-general.jpg","alt":"Dentist examining a patient","focalX":50,"focalY":40}', 'General Dentistry in Kampala · JABARI DENTAL', 'Routine dental check-ups, preventive care and fillings at JABARI DENTAL, a premium clinic in Kampala, Uganda.', 1, 1, 1, 1, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t2', 'cosmetic-dentistry', 'Cosmetic Dentistry', 'Smile Design', 'Thoughtful, natural-looking improvements to the colour, shape and harmony of your smile.', 'Cosmetic dentistry at JABARI DENTAL is about balance and proportion, not extremes.

We plan every change around your face, your features and what will look genuinely like you — only better.', '✶', 'Varies', '', 0, '[{"question":"Will it look natural?","answer":"Yes. We design cosmetic work to suit your features and keep results refined rather than exaggerated."}]', '{"src":"/images/stock/treatment-cosmetic.jpg","alt":"Close-up of a bright natural smile","focalX":50,"focalY":40}', 'Cosmetic Dentistry in Kampala · JABARI DENTAL', 'Natural-looking cosmetic dentistry in Kampala, Uganda — smile design, veneers and more at JABARI DENTAL.', 1, 1, 1, 2, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t3', 'teeth-whitening', 'Teeth Whitening', 'Smile Design', 'Safe, professional whitening that brightens your smile without sensitivity surprises.', 'Professional whitening is more controlled and more comfortable than over-the-counter kits.

We assess your teeth first and choose an approach that protects your enamel.', '☀', '45–60 min', '', 0, '[{"question":"Is whitening safe?","answer":"When done professionally and assessed by a dentist, whitening is safe for most healthy teeth."}]', '{"src":"/images/stock/treatment-whitening.jpg","alt":"Professional teeth whitening treatment","focalX":50,"focalY":40}', 'Teeth Whitening in Kampala · JABARI DENTAL', 'Safe, professional teeth whitening in Kampala, Uganda at JABARI DENTAL.', 0, 1, 1, 3, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t4', 'orthodontics', 'Orthodontics', 'Alignment', 'Modern alignment options for straighter teeth and a healthier bite.', 'From clear aligners to conventional braces, we help you choose the right path for your smile and lifestyle.

Treatment begins with a careful assessment and a clear plan.', '⌒', 'Plan dependent', '', 0, '[{"question":"Am I too old for orthodontics?","answer":"Many adults straighten their teeth successfully. A consultation will confirm what is suitable for you."}]', '{"src":"/images/stock/treatment-ortho.jpg","alt":"Orthodontic consultation","focalX":50,"focalY":40}', 'Orthodontics in Kampala · JABARI DENTAL', 'Clear aligners and braces in Kampala, Uganda at JABARI DENTAL.', 0, 1, 1, 4, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t5', 'dental-implants', 'Dental Implants', 'Restoration', 'A durable, natural-feeling way to replace missing teeth.', 'Dental implants replace both the root and the visible tooth, helping preserve bone and restore confident function.

Every case is planned individually with imaging.', '⌗', 'Plan dependent', '', 0, '[{"question":"Who is a candidate?","answer":"Suitability depends on bone health and overall condition. A consultation and scan will confirm."}]', '{"src":"/images/stock/treatment-implants.jpg","alt":"Dental implant planning","focalX":50,"focalY":40}', 'Dental Implants in Kampala · JABARI DENTAL', 'Dental implants in Kampala, Uganda — natural-looking tooth replacement at JABARI DENTAL.', 0, 1, 1, 5, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO treatments (id,slug,name,category,short_description,long_description,icon,duration,price,price_visible,faqs,image,seo_title,seo_description,featured,active,published,display_order,created_at,updated_at) VALUES ('t6', 'childrens-dentistry', 'Children''s Dentistry', 'Family', 'Gentle, friendly dental care that helps children feel at ease.', 'We make early visits calm and positive so children build a healthy relationship with dental care.

Care is age-appropriate, unhurried and reassuring.', '♥', '20–40 min', '', 0, '[{"question":"When should my child first visit?","answer":"A first visit is often recommended when the first teeth appear or by their first birthday."}]', '{"src":"/images/stock/treatment-kids.jpg","alt":"Child-friendly dental visit","focalX":50,"focalY":40}', 'Children''s Dentistry in Kampala · JABARI DENTAL', 'Gentle children''s dentistry in Kampala, Uganda at JABARI DENTAL.', 0, 1, 1, 6, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO articles (id,slug,title,excerpt,body,author,category,tags,published_date,updated_date,seo_title,seo_description,featured_image,social_image,featured,published,display_order,created_at,updated_at) VALUES ('ar1', 'five-habits-for-a-healthier-smile', 'Five small habits for a healthier smile', 'Lasting oral health is built on consistent, gentle habits. Here are five that make the biggest difference.', 'A healthy smile is rarely the result of one big thing — it is the quiet sum of small, repeatable habits.

## Brush with intention

Twice a day is the baseline. Use a soft brush and a fluoride toothpaste, and take your time along the gum line where problems usually start.

## Clean between your teeth

Interdental cleaning reaches the spaces a brush cannot. Whether you prefer floss or small brushes, consistency matters more than technique perfection.

## Rethink sugary snacking

Frequent sugar exposure is harder on teeth than the amount itself. If you snack, water and a rinse afterwards help.

## Don''t skip check-ups

Regular visits let small issues be handled early, when they are easier, calmer and less costly.

## Notice changes

Bleeding gums, sensitivity or persistent dryness are worth mentioning. Early conversation is easier than late correction.', 'JABARI DENTAL', 'Oral Health', '["prevention","daily care"]', '2024-02-10', '2024-02-10', 'Five habits for a healthier smile · JABARI DENTAL', 'Simple, evidence-aware daily habits that protect your oral health, from the team at JABARI DENTAL in Kampala.', '{"src":"/images/stock/article-habits.jpg","alt":"Everyday oral care items","focalX":50,"focalY":40}', '{"src":"/images/stock/article-habits.jpg","alt":"Oral health habits","focalX":50,"focalY":40}', 1, 1, 1, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO articles (id,slug,title,excerpt,body,author,category,tags,published_date,updated_date,seo_title,seo_description,featured_image,social_image,featured,published,display_order,created_at,updated_at) VALUES ('ar2', 'what-to-expect-at-your-first-visit', 'What to expect at your first visit', 'New to the clinic? Here is how a first appointment at JABARI DENTAL is designed to feel calm and clear.', 'Walking into a new clinic can feel uncertain. We design first visits to remove that uncertainty.

## Before you arrive

You can book by WhatsApp or phone — no account needed. Let us know what is on your mind and any dates that suit you.

## When you arrive

Our reception is a calm place to settle in. We will confirm a few details and answer any questions.

## The conversation first

We listen before we look. Your goals and concerns shape the examination.

## The examination

A gentle, thorough check focuses on what matters to your long-term health, with clear explanations as we go.

## A clear next step

You leave with a simple, understandable plan — no pressure, no jargon.', 'JABARI DENTAL', 'Patient Guides', '["first visit","experience"]', '2024-02-18', '2024-02-18', 'What to expect at your first visit · JABARI DENTAL', 'A calm, clear guide to your first dental visit at JABARI DENTAL in Kampala, Uganda.', '{"src":"/images/stock/article-first.jpg","alt":"Calm clinic reception","focalX":50,"focalY":40}', '{"src":"/images/stock/article-first.jpg","alt":"First visit","focalX":50,"focalY":40}', 1, 1, 2, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO articles (id,slug,title,excerpt,body,author,category,tags,published_date,updated_date,seo_title,seo_description,featured_image,social_image,featured,published,display_order,created_at,updated_at) VALUES ('ar3', 'whitening-gently-what-is-safe', 'Whitening, gently: what is actually safe', 'Not all whitening is equal. Here is how professional care keeps brightening safe and comfortable.', 'Whitening is one of the most asked-about treatments — and one of the most misunderstood.

## Why professional matters

A dentist checks your teeth and gums first, so whitening is matched to your condition rather than guessed.

## Comfort comes first

Sensitivity is manageable when products and timing are chosen carefully. We plan around your comfort.

## Realistic expectations

Results vary with your starting shade and habits. We would rather be honest about outcomes than over-promise.', 'JABARI DENTAL', 'Treatment Education', '["whitening","cosmetic"]', '2024-03-02', '2024-03-02', 'Safe teeth whitening · JABARI DENTAL', 'How professional teeth whitening stays safe and comfortable, explained by JABARI DENTAL in Kampala.', '{"src":"/images/stock/article-whitening.jpg","alt":"Bright natural smile","focalX":50,"focalY":40}', '{"src":"/images/stock/article-whitening.jpg","alt":"Teeth whitening","focalX":50,"focalY":40}', 0, 1, 3, '2026-09-05T14:16:21.102Z', '2026-09-05T14:16:21.102Z');
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g1', 'Reception', 'clinic', 'A calm space to arrive and settle in.', '{"src":"/images/stock/gallery-reception.jpg","alt":"Clinic reception area","focalX":50,"focalY":40}', 'Clinic reception area in warm light', '2024-01-01', 1, 1, 1);
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g2', 'Treatment room', 'clinic', 'Considered, comfortable clinical spaces.', '{"src":"/images/stock/gallery-room.jpg","alt":"Dental treatment room","focalX":50,"focalY":40}', 'Dental treatment room', '2024-01-01', 1, 1, 2);
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g3', 'Natural light', 'clinic', 'Light and quiet throughout the clinic.', '{"src":"/images/stock/gallery-light.jpg","alt":"Sunlit clinic corridor","focalX":50,"focalY":40}', 'Sunlit clinic corridor', '2024-01-01', 0, 1, 3);
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g4', 'Smile', 'smile', 'The reason we do what we do.', '{"src":"/images/stock/gallery-smile.jpg","alt":"A confident smile","focalX":50,"focalY":40}', 'A confident smile', '2024-01-01', 0, 1, 4);
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g5', 'Detail', 'treatments', 'Precision in every step.', '{"src":"/images/stock/gallery-detail.jpg","alt":"Dental instruments arranged neatly","focalX":50,"focalY":40}', 'Neatly arranged dental instruments', '2024-01-01', 0, 1, 5);
INSERT OR REPLACE INTO gallery (id,title,category,description,image,alt,date,featured,published,display_order) VALUES ('g6', 'Comfort', 'lifestyle', 'Care that feels considered.', '{"src":"/images/stock/gallery-comfort.jpg","alt":"Comfortable waiting lounge","focalX":50,"focalY":40}', 'Comfortable waiting lounge', '2024-01-01', 0, 1, 6);
INSERT OR REPLACE INTO testimonials (id,display_name,quote,rating,date,is_demo,approved,featured,published,display_order) VALUES ('tm1', 'Demo Patient', 'Demo testimonial — replace with a real, approved patient quote in the admin panel. We never publish reviews without consent.', 5, '2024-01-01', 1, 0, 0, 0, NULL);
INSERT OR REPLACE INTO announcements (id,title,message,cta_label,cta_url,start_date,end_date,priority,published,style) VALUES ('a1', 'Now accepting appointments', 'We are welcoming new patients for consultations and routine care.', 'Book now', '/book', '2024-01-01', '2030-12-31', 'normal', 1, 'bar');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('mon', 'monday', 'Monday', 0, '08:00', '18:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('tue', 'tuesday', 'Tuesday', 0, '08:00', '18:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('wed', 'wednesday', 'Wednesday', 0, '08:00', '18:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('thu', 'thursday', 'Thursday', 0, '08:00', '18:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('fri', 'friday', 'Friday', 0, '08:00', '18:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('sat', 'saturday', 'Saturday', 0, '09:00', '14:00', '', '');
INSERT OR REPLACE INTO hours (id,day,label,closed,open,close,open2,close2) VALUES ('sun', 'sunday', 'Sunday', 1, '', '', '', '');
INSERT OR REPLACE INTO faqs (id,question,answer,display_order,published) VALUES ('f1', 'How do I book an appointment?', 'Use the Book Appointment button or message us on WhatsApp at +256770590299. No account is required.', 1, 1);
INSERT OR REPLACE INTO faqs (id,question,answer,display_order,published) VALUES ('f2', 'What happens during my first visit?', 'We start with a conversation about your goals, then a gentle examination with clear explanations and a simple plan.', 2, 1);
INSERT OR REPLACE INTO faqs (id,question,answer,display_order,published) VALUES ('f3', 'Where are you located?', 'We are in Kampala, Uganda. Use the Get Directions button for our verified map location.', 3, 1);
INSERT OR REPLACE INTO faqs (id,question,answer,display_order,published) VALUES ('f4', 'What are your opening hours?', 'Opening hours are set by the clinic and shown live on this site. Check the top of the page for current open/closed status.', 4, 1);
INSERT OR REPLACE INTO faqs (id,question,answer,display_order,published) VALUES ('f5', 'How can I contact the clinic?', 'Call or WhatsApp +256770590299, or use the contact section. We reply as soon as we can during opening hours.', 5, 1);
INSERT OR REPLACE INTO social (id,label,url,display_order,published) VALUES ('s1', 'Instagram', 'https://instagram.com/', 1, 0);
INSERT OR REPLACE INTO social (id,label,url,display_order,published) VALUES ('s2', 'Facebook', 'https://facebook.com/', 2, 0);
