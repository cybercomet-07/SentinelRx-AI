--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: medicines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.medicines (id, name, description, price, quantity, category, image_url, low_stock_threshold, created_at, updated_at, product_id, pin, manufacturing_date, expiry_date) FROM stdin;
02c05932-ca90-4e70-b217-f79f73b20333	Paracetamol 500 mg tablets	Pain and fever relief tablets	2.06	203	Analgesic	\N	35	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
873875ac-9135-470e-a1eb-2b0fd6881e87	MULTILAC Darmsynbiotikum	Pro- and prebiotic combination for gut health	9.99	119	Gastrointestinal	\N	25	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
9a78b454-94ea-4b6c-81a4-758a5be54604	Aqualibra Film Tablets	Herbal support for bladder function	27.82	68	Urology	\N	15	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
a7d3f698-07bb-474a-a4a9-a74c9aef2a3c	NORSAN Omega-3 Vegan	Algae-based omega-3 for vegetarians and vegans	29.1	55	Supplements	\N	10	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.332601	\N	\N	\N	2026-03-05
c0981454-ec76-4438-b745-51d34d5e1147	Panthenol Spray 46.3 mg/g	Regenerating foam spray for irritated or damaged skin	19.95	80	Dermatology	\N	15	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.335273	\N	\N	\N	2026-03-03
f41529da-fedb-4152-b0a1-e5f2a568f8ad	NORSAN Omega-3 Total	Omega-3 fish oil for heart brain and joints	27	65	Supplements	\N	12	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.33889	\N	\N	\N	2026-03-04
a4971b49-cdb1-4142-9be8-f92266e07f43	proBIO 6 probiotic capsules APOMIA	Probiotic capsules for digestive balance	34.9	27	Gastrointestinal	\N	8	2026-02-28 18:14:03.245166	2026-03-01 05:24:15.591266	\N	\N	\N	\N
dcb8cf40-d245-4e1d-a740-1af761727dbc	NORSAN Omega-3 Kapseln	Omega-3 capsules for daily support	29.12	60	Supplements	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
7433af0a-bcd5-47a9-ad52-8be83cb8d80e	Vividrin iSO EDO antiallergic eye drops	Preservative-free eye drops for allergy symptoms	8.28	90	Eye Care	\N	20	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
2d4bce97-107c-451a-8adf-01280cdab2b1	Vitasprint Pro Energie	Energy supplement with B vitamins and amino acids	15.95	75	Supplements	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
82213607-81ff-4061-823b-3b4a11f60e63	Cystinol akut	Herbal support for urinary tract discomfort	26.5	68	Urology	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
e3ab727b-acbd-4807-ad63-2e0137a36658	Cromo ratiopharm eye drops single dose	Antiallergic eye drops for irritated eyes	7.59	85	Eye Care	\N	20	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
92ab9f99-a4e2-4a1e-a3d3-a62d2be2edc2	Kijimea Reizdarm PRO	Medical product to reduce IBS symptoms	38.99	45	Gastrointestinal	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
ab2b5ab3-0815-4675-8bb6-2b5020fe9d9b	Mucosolvan once-daily retard capsules	Long-acting expectorant for cough relief	39.97	50	Respiratory	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
7cd542eb-5aad-4d0b-ad4c-9f2367dca101	OMNI-BIOTIC SR-9 with B vitamins	Probiotic for gut and energy metabolism	44.5	35	Supplements	\N	8	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
1f3d4c8c-7509-48aa-a20e-be4a1f7912f9	Osa Schorf Spray	Care spray for removing cradle cap in babies	15.45	70	Baby Care	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
44b96553-f798-4da6-95fc-aaa3ca64e78f	Multivitamin fruit gummies vegan sugar free	Vegan sugar-free multivitamin gummies	12.4	95	Supplements	\N	20	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
e030a3c6-a005-40b1-ad50-e500b739b30f	Iberogast classic oral liquid	Herbal medicine for gastrointestinal discomfort	28.98	65	Gastrointestinal	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
0dea293b-d838-4f59-81b7-99d3bdadd960	COLPOFIX	Vaginal gel supporting healthy cervicovaginal tissue	49.6	30	Women Health	\N	8	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
05066f82-4d66-4e79-98a7-0b825162582f	RedCare eye drops	Moisturizing eye drops for dry and irritated eyes	12.69	85	Eye Care	\N	20	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
34cadf66-642f-4f51-9824-10063f2338c9	SAW PALMETTO 350 mg	Plant-based support for prostate function	8.47	90	Men Health	\N	18	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
e73fddd0-e659-4bdb-801f-e56621a958e1	Prostata Men capsules	Dietary supplement for prostate support	19.99	55	Men Health	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
1fa5a199-d70a-4015-a66f-c42d5aa2c4a9	Natural Intimate Creme	Intimate care cream for sensitive skin areas	18.9	40	Women Health	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
b9ba47c5-b5f3-4cb3-881b-3f1d62c17504	Magnesium Verla N gastro-resistant dragees	Magnesium supplement for muscles and nerves	6.4	130	Supplements	\N	25	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.335273	\N	\N	\N	\N
cb59659a-bea3-455e-bca6-dca2d84476e6	Bepanthen wound and healing ointment 50 mg/g	Ointment for wound healing and skin care	7.69	110	Dermatology	\N	20	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.337879	\N	\N	\N	\N
bb6d3c89-0841-46d0-af60-eb533eb89eb6	Aveeno Skin Relief Body Lotion	Soothing body lotion for dry itchy skin	14.99	67	Dermatology	\N	15	2026-02-28 18:14:03.245166	2026-03-14 19:31:34.806455	\N	\N	\N	\N
b0aa6ed2-2bb4-4451-82b5-5ed865f749b7	Eucerin DERMOPURE Triple Effect cleansing gel	Cleansing gel for blemish-prone skin	17.25	74	Dermatology	\N	15	2026-02-28 18:14:03.245166	2026-03-14 19:47:34.062364	\N	\N	\N	\N
0dc40e88-08a6-4740-87b8-8df635955fb0	frida baby Flakefixer	Gentle tool for removing baby cradle cap	0.1	119	Baby Care	\N	25	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
640f0b34-40d6-4ca3-bd60-c7e8ee650217	Livocab direct eye drops 0.05 percent	Fast-acting eye drops for allergy symptoms	14.99	60	Eye Care	\N	15	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
12c7403e-b33f-4aa8-b1a6-941d3acbbb04	Vitaphin D3 drops	Vitamin D drops for bones and immunity	16.95	60	Supplements	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
b3fbaef9-818c-419a-8332-c7065af9040d	V-Biotics Flora Complex	Probiotic supplement for gut and immune support	19.9	48	Supplements	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
b0a7dfc9-3428-48b6-961e-c9572879215c	Centrum Vital plus mental performance	Multivitamin for mental performance support	19.95	58	Supplements	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
649055dd-0624-41a4-97cc-84a23a0e7fdf	Redcare Wundschutzcreme	Barrier cream for irritated and sensitive skin	14.39	80	Dermatology	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
5bc8dc2b-dda4-4f32-a433-037d5cfccd1a	Cetaphil smoothing salicylic acid cleanser	Gentle cleanser with salicylic acid	13.95	76	Dermatology	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
4183cfd0-693e-4eed-bfd5-7e9ea46545b6	Cetirizin HEXAL drops 10 mg/ml	Antiallergic oral drops	13.19	100	Allergy	\N	20	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
1beaeae2-b98f-40d9-ac3d-55f6e15fabf8	Fenihydrocort cream 0.25 percent	Cortisone cream for skin irritation and itching	8.59	69	Dermatology	\N	14	2026-02-28 18:14:03.245166	2026-03-01 03:31:26.324933	\N	\N	\N	\N
3ca851c5-f864-47ed-b617-737e1570ad5f	Ramipril 10 mg tablets	Prescription medicine for high blood pressure	12.59	95	Cardiovascular	\N	18	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
0bc92e8c-26a9-46f9-88b1-1d2a8e0802bf	GRANU FINK femina capsules	Herbal support for women bladder health	20.29	50	Women Health	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
6cdec5c8-a965-4fa8-b120-66f1a59379e0	Vitasprint B12 capsules	Vitamin B12 support for energy and nerves	17.04	72	Supplements	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
c78cd262-b932-4160-b241-10624bf37549	Loperamid akut 1 A Pharma 2 mg	Treatment for acute diarrhea	3.93	139	Gastrointestinal	\N	30	2026-02-28 18:14:03.245166	2026-03-01 05:05:28.065805	\N	\N	\N	\N
f1e5f402-cec7-4f7f-866a-d68ae08b012c	Sinupret Saft	Herbal syrup for sinus inflammation	13.3	66	Respiratory	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
72e4e930-8425-422f-b4f4-db3ab48670a9	Nurofen 200 mg melt tablets lemon	Ibuprofen melt tablets for pain relief	10.98	84	Analgesic	\N	18	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
bb375c58-216f-4caa-aeba-bdf3db442575	Vitamin B complex ratiopharm	Combination of B vitamins for nervous system support	24.97	45	Supplements	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
5064aab5-950a-490a-a332-736bb890d3be	Calmvalera Hevert drops	Homeopathic support for restlessness and sleep issues	35.97	35	Neurology	\N	8	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
4f8745a4-e7d0-409b-8682-f1460b859f62	Umckaloabo syrup for children	Herbal syrup for respiratory tract support	13.15	60	Respiratory	\N	12	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
0e27fe4f-7483-4630-92ba-dc60a306e7a5	Diclac-ratiopharm pain gel	Topical gel for muscle and joint pain	8.89	77	Analgesic	\N	15	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
20db0b53-0077-4f37-9a6c-cc1f271ca150	Minoxidil BIO-H-TIN Pharma 20 mg/ml spray	Scalp solution for hereditary hair loss	22.5	42	Dermatology	\N	10	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
32079533-895e-4002-90aa-d21168671ddb	Hyaluron ratiopharm eye drops	Moisturizing eye drops with hyaluronic acid	13.74	74	Eye Care	\N	16	2026-02-28 18:14:03.245166	2026-02-28 18:14:03.245166	\N	\N	\N	\N
91719378-1da1-4a17-87e8-bd85c991546c	Vigantolvit 2000 IU Vitamin D3	Vitamin D preparation for bones and immunity	17.99	90	Supplements	\N	20	2026-02-28 18:14:03.245166	2026-03-01 06:23:24.458981	\N	\N	\N	\N
c4e7ff90-b05d-4bb6-9170-ce3d95242b05	femiloges 4 mg gastro-resistant tablets	Hormone-free support for menopausal symptoms	20.4	37	Women Health	\N	8	2026-02-28 18:14:03.245166	2026-03-14 19:47:34.062364	\N	\N	\N	\N
cc6ae948-c648-4206-9484-ae82f20fc1c8	Eucerin UreaRepair PLUS lotion 10 percent	Intensive lotion for very dry rough skin	27.75	51	Dermatology	\N	10	2026-02-28 18:14:03.245166	2026-03-14 19:47:34.062364	\N	\N	\N	\N
aacf8493-3b2b-4f7d-9a9e-80e2ef469234	Dulcolax dragees 5 mg gastro-resistant	Laxative for constipation treatment	22.9	86	Gastrointestinal	\N	18	2026-02-28 18:14:03.245166	2026-03-14 20:01:53.774464	\N	\N	\N	\N
\.


--
-- Data for Name: medicine_indications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.medicine_indications (id, medicine_id, keywords, dosage_instructions, safe_limit, requires_prescription) FROM stdin;
f4095f29-0ee0-4c20-9c5b-69f0361cc047	02c05932-ca90-4e70-b217-f79f73b20333	pain relief, fever reduction, headache, body pain, cold symptoms	1-2 tablets every 4-6 hours	Max 3,000-4,000 mg/day. Max 1,000 mg per dose. Do not exceed 3 days without doctor.	f
21ad49e0-ff79-4dc2-a370-0a0da20c2ed3	9a78b454-94ea-4b6c-81a4-758a5be54604	bladder support, urinary tract, mild UTI support, urinary discomfort, herbal bladder medicine	As per product label	\N	f
30814d1d-de01-4e60-bb7a-8a63da59d733	a7d3f698-07bb-474a-a4a9-a74c9aef2a3c	plant omega-3, vegan supplement, heart support, brain health, anti-inflammatory, algae oil	As per product label	\N	f
e97b0268-2e11-4c89-b05a-194aa616622d	c0981454-ec76-4438-b745-51d34d5e1147	skin regeneration, irritated skin, damaged skin, wound care, dry skin, minor burns, skin hydration, dermatology care	External use only, apply as needed	External use only. Apply as needed.	f
cf56778d-1f05-4d76-9cc2-f30527a90ca7	f41529da-fedb-4152-b0a1-e5f2a568f8ad	heart health, brain function, joint support, inflammation reduction, cardiovascular support, omega-3 supplement, memory support	As per product label	\N	f
3fd971b6-69c5-443c-8741-5a33f6e4e564	dcb8cf40-d245-4e1d-a740-1af761727dbc	omega-3 capsules, cholesterol support, heart health, cognitive function, joint mobility	As per product label	\N	f
1516e08c-c590-46ed-abc1-229f4775ac6c	7433af0a-bcd5-47a9-ad52-8be83cb8d80e	allergy eyes, itchy eyes, red eyes, allergic conjunctivitis, pollen allergy, eye drops	As per product label	\N	f
148db4d3-1bfa-4cb1-8432-460a71092299	2d4bce97-107c-451a-8adf-01280cdab2b1	fatigue, low energy, vitamin B complex, energy boost, mental performance, amino acids	As per product label	\N	f
5aea9e6a-d230-4e38-ade7-7a29bcfe2187	82213607-81ff-4061-823b-3b4a11f60e63	urinary tract infection, UTI treatment, bladder infection, painful urination, herbal antibiotic support	As per product label	\N	f
ac30fbd9-db35-4fbd-9434-aaf671ab3bb4	e3ab727b-acbd-4807-ad63-2e0137a36658	eye allergy prevention, itchy eyes, allergic eye drops, seasonal allergy, antihistamine eye	As per product label	\N	f
6616fda6-307e-44e1-a8c4-48ff3f1a3320	92ab9f99-a4e2-4a1e-a3d3-a62d2be2edc2	IBS, irritable bowel syndrome, bloating, abdominal pain, gut microbiome, digestive health	As per product label	\N	f
2b77857b-a52a-4624-93a2-b50be140bc3f	ab2b5ab3-0815-4675-8bb6-2b5020fe9d9b	cough relief, mucus dissolving, bronchitis, chest congestion, respiratory infection	1 capsule daily	Max 4-5 days without doctor.	f
299c72a3-ae00-4be7-bf1e-6a5dbf1af9af	7cd542eb-5aad-4d0b-ad4c-9f2367dca101	probiotic, gut flora support, immune support, fatigue reduction, digestive balance	As per product label	\N	f
66c5299c-a019-410f-a8c6-7227deba3358	1f3d4c8c-7509-48aa-a20e-be4a1f7912f9	cradle cap, baby scalp care, dry scalp baby, infant skin care	As per product label	\N	f
62ac98ad-a3c5-4c42-8ae5-83a590c2eb79	44b96553-f798-4da6-95fc-aaa3ca64e78f	multivitamin, immune support, daily vitamins, vegan vitamins, sugar-free supplement	As per product label	\N	f
8f54cc6d-3592-45ce-a177-efadc03f90bc	e030a3c6-a005-40b1-ad50-e500b739b30f	stomach pain, gastritis, indigestion, bloating, IBS, acid reflux	20 drops 3 times daily	Short-term use recommended.	f
b643b6d6-afd1-4d7b-9fad-516366cbc45f	0dea293b-d838-4f59-81b7-99d3bdadd960	cervical health, vaginal gel, HPV support, vaginal dryness, mucosal healing	As per product label	\N	f
0e642eee-1f91-44b1-8c4b-967c5785911b	05066f82-4d66-4e79-98a7-0b825162582f	dry eyes, irritated eyes, eye hydration, screen dryness relief	As per product label	\N	f
2f7b5352-f632-45a8-a46a-ef3d63d530cc	873875ac-9135-470e-a1eb-2b0fd6881e87	probiotic, prebiotic, digestive balance, gut flora, antibiotic recovery	As per product label	\N	f
5df6f31a-4714-449e-9610-8ba8f15b70b2	34cadf66-642f-4f51-9824-10063f2338c9	prostate health, urinary flow, BPH support, men's health supplement	320-350 mg/day typical dose	\N	f
17423cb8-2ec1-4839-83b3-327e9d80d2c6	e73fddd0-e659-4bdb-801f-e56621a958e1	prostate support, urinary health, men's supplement	1-2 capsules daily	\N	f
a1229f97-aacb-488c-bb60-b1ecfd7529ad	1fa5a199-d70a-4015-a66f-c42d5aa2c4a9	intimate care, vaginal dryness, irritation relief, sensitive skin care	As per product label	\N	f
3f01d4f6-b03e-4d83-b266-af131ec87f1d	a4971b49-cdb1-4142-9be8-f92266e07f43	probiotic capsules, digestive health, bloating relief, gut balance	As per product label	\N	f
3fc50502-167f-4514-8810-b371038ac899	0dc40e88-08a6-4740-87b8-8df635955fb0	baby scalp, cradle cap remover, infant grooming	As per product label	\N	f
ed9a658f-3f1e-4ca6-8be1-6e52d9459bbe	b9ba47c5-b5f3-4cb3-881b-3f1d62c17504	muscle cramps, magnesium deficiency, nerve support, stress reduction	As per product label	Max 250-400 mg elemental magnesium/day. High doses cause diarrhea.	f
f705955f-80f8-4637-ad70-4fae903d1c8d	bb6d3c89-0841-46d0-af60-eb533eb89eb6	dry skin relief, eczema care, itching relief, body moisturizer	As per product label	\N	f
4e1cab4f-b98f-4732-a084-9e26ac0c1640	cb59659a-bea3-455e-bca6-dca2d84476e6	wound healing, diaper rash, skin repair, minor cuts, skin irritation	External application	Safe for daily use.	f
0d4a68b1-dc04-439d-8f50-2a58bf678c04	b0aa6ed2-2bb4-4451-82b5-5ed865f749b7	acne treatment, oily skin, pimples, blemishes, facial cleanser	1-2 times daily	Avoid overuse (skin dryness).	f
359c3c68-d04e-4d74-b483-87ae8582979a	12c7403e-b33f-4aa8-b1a6-941d3acbbb04	vitamin D deficiency, bone health, immune support, calcium absorption	2,000 IU/day typical	Upper safe limit ~4,000 IU/day.	f
f75f836e-aa9e-4b23-ba9a-847ea8588ce2	b3fbaef9-818c-419a-8332-c7065af9040d	immune support, probiotic blend, gut health, digestive support	As per product label	\N	f
3e6154c6-a670-471d-b503-3f87128ce9c0	b0a7dfc9-3428-48b6-961e-c9572879215c	brain health, cognitive support, memory, multivitamin, focus support	As per product label	\N	f
5856d25f-1ff2-41ca-b2b4-bd72589e252c	649055dd-0624-41a4-97cc-84a23a0e7fdf	skin barrier cream, diaper rash prevention, irritated skin care	As per product label	\N	f
a41dcd91-8cc8-4d0f-ae4b-a6a92c21d61d	5bc8dc2b-dda4-4f32-a433-037d5cfccd1a	salicylic acid cleanser, rough skin, acne, exfoliating cleanser	1-2 times daily	Avoid overuse (skin dryness).	f
8205c17d-e2d3-4023-9610-eca30338e508	640f0b34-40d6-4ca3-bd60-c7e8ee650217	eye allergy relief, antihistamine eye drops, hay fever	As per product label	\N	f
615b6c1e-e403-4c0a-99ca-69207e98a60e	4183cfd0-693e-4eed-bfd5-7e9ea46545b6	allergy relief, antihistamine, hay fever, itching, sneezing	10 mg/day (Adults)	Avoid driving if drowsy.	f
b3600fe1-b698-4d3c-8b9f-907fef3c8da9	1beaeae2-b98f-40d9-ac3d-55f6e15fabf8	skin inflammation, itching, eczema, dermatitis, mild cortisone	Thin layer application	Use max 1-2 weeks. Avoid large skin areas.	f
c689a86d-98e6-4b92-9d12-f2de1bd586b6	91719378-1da1-4a17-87e8-bd85c991546c	vitamin D deficiency, bone health, immune support, calcium absorption	2,000 IU/day typical	Upper safe limit ~4,000 IU/day.	f
7e9f3f13-0fb5-49f4-8e8b-a6be88beefae	c78cd262-b932-4160-b241-10624bf37549	diarrhea treatment, acute diarrhea, stomach upset, travel diarrhea	As per product label	Max 8 mg/day OTC. Use max 2 days. Not for children under 6.	f
7fcc960b-1de7-4c27-beb3-9eece174f001	3ca851c5-f864-47ed-b617-737e1570ad5f	high blood pressure, hypertension, heart failure, cardiovascular risk reduction	Prescription only	Prescription required. Doctor monitoring mandatory.	t
2355f6d9-3c87-4ed1-bcfe-93f2a19e150a	0bc92e8c-26a9-46f9-88b1-1d2a8e0802bf	bladder health women, urinary frequency, urinary discomfort	As per product label	\N	f
2b893918-c691-4b64-90dc-e6eba95a3e53	6cdec5c8-a965-4fa8-b120-66f1a59379e0	vitamin B12 deficiency, energy support, nerve function, anemia prevention	1 capsule daily	High dose B12 usually safe but medical advice recommended.	f
ff5ceacb-d0ed-480f-8593-54667c227c11	f1e5f402-cec7-4f7f-866a-d68ae08b012c	sinusitis, nasal congestion, sinus infection, cold symptoms	As per age dosing	Max 7-14 days use.	f
bd88aa2d-9141-451d-a9e2-633f3d79e537	72e4e930-8425-422f-b4f4-db3ab48670a9	pain relief, ibuprofen, headache, muscle pain, fever, inflammation	As per product label	Max 1,200 mg/day OTC. Take with food. Max 3 days without doctor.	f
b055eb02-a3b4-4ab5-8dcd-826518dcff33	bb375c58-216f-4caa-aeba-bdf3db442575	B vitamins, nerve health, fatigue, stress support	As per product label	\N	f
79368b0d-2b47-4596-993a-bc9e909b6191	5064aab5-950a-490a-a332-736bb890d3be	sleep aid, anxiety relief, nervousness, stress	As directed	Avoid long-term self-medication. STRICT: Sleep-related medicines require prescription.	t
47fcf60e-0d15-4773-b529-7395d2d9adf0	c4e7ff90-b05d-4bb6-9170-ce3d95242b05	menopause symptoms, hot flashes, hormonal balance, mood swings	As per product label	\N	f
23417b7a-8e92-426a-a041-65df27fa6b58	4f8745a4-e7d0-409b-8682-f1460b859f62	respiratory infection, cough, bronchitis, cold in children	As per age dosing	Max 7 days use.	f
5b74ed48-8e7e-435b-961e-33bdad2d58ab	aacf8493-3b2b-4f7d-9a9e-80e2ef469234	constipation relief, laxative, bowel movement stimulation	5-10 mg daily	Short-term use only (max 1 week). Avoid chronic use.	f
8b77fc60-2eba-4f15-815b-45f7d4536520	0e27fe4f-7483-4630-92ba-dc60a306e7a5	muscle pain, joint pain, arthritis, sprain, topical anti-inflammatory	Apply 3-4 times daily	Max 14 days without medical advice. External use only. Avoid broken skin.	f
e5535279-92a7-4859-a62b-98666682147d	20db0b53-0077-4f37-9a6c-cc1f271ca150	hair loss treatment, alopecia, hair regrowth, scalp treatment	Apply 1 ml twice daily	Do not exceed 2 ml/day. Continuous long-term use required.	f
45e848e7-4b9f-4c16-9e2a-ced232b96e2b	32079533-895e-4002-90aa-d21168671ddb	dry eyes, eye lubrication, eye strain, contact lens dryness	Use as needed	Up to several times daily.	f
09320146-1306-483f-b2b1-9e23b1904d38	cc6ae948-c648-4206-9484-ae82f20fc1c8	very dry skin, cracked skin, urea lotion, skin barrier repair	As per product label	\N	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, is_active, created_at, phone, address, landmark, pin_code, date_of_birth, gender, preferred_language) FROM stdin;
6fe0760b-0c58-4439-b613-ebae6491f2ca	Pranav Khaire 	pranavkhaire53@gmail.com	$2b$12$kvJV62XuCxsEd8NynNtXP.IsWQn7xCCPn5lWIrNpw1cLoZLH5i//y	USER	t	2026-02-27 19:19:06.759141	\N	\N	\N	\N	\N	\N	en
681f7637-28b1-4b2f-901d-4fec8f739df9	Admin User	admin@example.com	$2b$12$0P3Roy/Pu.2BRnH6bGboR.1hMx65Cvyiuq7UbFHC9rs5BN23DYIdy	ADMIN	t	2026-02-27 22:03:35.365656	\N	\N	\N	\N	\N	\N	en
bc7e8c6a-3251-4085-a874-62aba8f69152	Demo User	user@sentinelrx.ai	$2b$12$NEt7TNZmj9gVHm/jWqq3aeeh.ujqZR/uDnulBArxm0vs/.Tn6QlMO	USER	t	2026-02-27 22:03:35.686171	\N	\N	\N	\N	\N	\N	en
718166d5-08d9-4b64-83ed-ef0f52f40bb2	Parth Kulkarni	parthkulkarni0007@gmail.com	$2b$12$5qYLV0pDSba8Fyd8KCe8C.96fVKJQgCW4l9oIJmkTh1O6iU9J94fO	USER	t	2026-02-28 10:27:31.011727	\N	\N	\N	\N	\N	\N	en
c0e829ea-9a96-4b27-8995-93ec633764c4	API Test User	apitest3096@example.com	$2b$12$lJ8AW.8d/aF5w0HdEA4C4.rvxQdTuc4oTHGhggK0q5P9FqakvO4H.	USER	t	2026-02-28 19:04:09.448691	\N	\N	\N	\N	\N	\N	en
a69a4888-5c71-4469-9972-75d2b92b6900	Parth Kulkarni	parthkulkarni7126@gmail.com	$2b$12$IYAbAhRmLZAe8o0oMS8Qx.sQtEaI/OoVbQ1eqXSuk0.CsCD1GI99e	ADMIN	t	2026-02-26 09:27:49.133679	9923410767	sambhajinagar	mill corner	431001	2006-08-26	male	en
e89a475d-90c6-4b5f-b938-083f98e811b6	Shravani Kulkarni	shravanikulkarni247@gmail.com	$2b$12$Mb6EJPCFqu/m59/wPEMXze3.DeEM.fGiFO2tifhK/sd06OA6kTDse	USER	t	2026-03-01 01:59:29.109219	7020719461	Hanuman Nagar, Chhatrapati Sambhaji Nagar, Chhatrapati Sambhajinagar, Chhatrapati Sambhajinagar District, Maharashtra, 431002, India	mill corner	431001	2006-07-29	female	en
398690ad-1754-4456-a0c0-804ae5e43686	Verify User	verify_62e0ef56@test.com	$2b$12$TKMZlCR2SAUCXNwf0j/iweDPmjkl0pXTOKQfIN/q4Q.YqVpeiFY6m	USER	t	2026-03-08 10:01:31.255777	9876543210	123 Test Street, Test City	Near Test Mall	400001	1990-01-15	\N	en
92afa9ab-eeac-4d73-bbe6-1487990903f4	Verify User	verify_2e68b945@test.com	$2b$12$qsp3UZRfr.pcPYG9wGayUe2TGCOYrAuQohsRyT8A/agIlZk88dQrq	USER	t	2026-03-08 10:02:09.019648	9876543210	123 Test Street, Test City	Near Test Mall	400001	1990-01-15	\N	en
3f1c4ab1-22a2-40c5-8e6a-c30927639081	Verify User	verify_4dee6180@test.com	$2b$12$uxQ85HOM2LrHbglmH0QpY.XFY4f7Ds2xq1dY5rb4d1t4Q8UVDkjjC	USER	t	2026-03-08 10:20:24.906183	9876543210	123 Test Street, Test City	Near Test Mall	400001	1990-01-15	\N	en
6f94c518-4ef5-4b62-932b-905e6147a758	Ved Kulkarni	ved@pharma.com	$2b$12$cEDQTPBMYMmc1yhnyag43.w5z/Tsc3L5Sjw0Kt.H0b5aSrvLzrt.S	USER	t	2026-03-08 10:48:08.859191	9923410767	c-60/16 shivajinagar sambhajinagar	mill corner	431005	2011-05-23	male	en
7ad4531f-203a-401d-be2c-fb3f4e65a727	Parth Kulkarni	parthkulkarni363@gmail.com	$2b$12$5TCMzq6KkgyMaDHt6QR1Ve8Wg4euo21d5z9K0loxRsCOv9XxEZstS	USER	t	2026-03-10 18:15:04.517981	09923410767	c-60/16 shivajinagar sambhajinagar	hanuman mandir	431005	2006-12-06	male	en
6436d620-a121-4ca9-a9a6-e81c27168bdd	Mitali Wadkar	mitali.wadkar61@gmail.com	$2b$12$qjTmHVmRsi8Aw0NBe29WnuwSed526tWE0p04Z49xxmppKF9NM3YhO	USER	t	2026-02-28 18:47:36.060634	09923410767	c-60/16 shivajinagar sambhajinagar	mill corner	431005	2006-08-23	prefer_not_to_say	en
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, typ, is_read, created_at) FROM stdin;
ed8ed1eb-23df-4c29-b703-12e78a9b861d	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 5594f59b-8bac-4f84-9209-31207bd7d01a has been placed. Total amount: 4.12.	ORDER	t	2026-02-28 19:16:51.072712
a8994443-495b-48f0-bd0d-7f6b350fb1f6	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order b550aefd-b861-4f79-b289-d413d54ace2e has been placed. Total amount: 14.99.	ORDER	t	2026-02-28 20:19:06.463697
ad0ee815-e20d-4d38-8fdc-1d31d57d5333	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order ad2866ef-1764-40fc-84c7-3e0a48e58a6d has been placed. Total amount: 30.76.	ORDER	t	2026-02-28 19:09:16.306705
ad324d35-1ed7-43cb-8066-4fb0367d57fc	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order df353be3-0ee8-40cc-8fae-8441c547078e has been placed. Total amount: 42.81.	ORDER	t	2026-02-28 18:54:00.489369
4840d12c-fc23-486f-acd4-edcd257e2f55	a69a4888-5c71-4469-9972-75d2b92b6900	Order placed successfully	Your order e21b6604-0071-472e-9252-e2d7f893183e has been placed. Total amount: 4.12.	ORDER	t	2026-02-28 14:59:53.023633
0edadc68-bb05-442b-870a-7de749715ce8	a69a4888-5c71-4469-9972-75d2b92b6900	Low stock alert	Notif Med 370712 stock is low (1) below threshold (2).	LOW_STOCK	t	2026-02-26 18:42:47.876499
f3887e28-7893-4937-a9ec-bc7e3c417b17	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order c92c0d3f-2b1e-461b-a346-48412e3ebeb3 has been placed. Total amount: 8.69.	ORDER	t	2026-02-28 20:11:46.31379
e316a2ed-0228-43ac-89f5-256e0cb23663	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order status updated	Order 5594f59b-8bac-4f84-9209-31207bd7d01a is now OUT_FOR_DELIVERY.	ORDER	t	2026-02-28 20:06:24.696579
7699a7be-6679-48f2-adee-0db7160fb1d3	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order f6e23da2-60ff-4257-857e-8b8fa0f8b4d1 has been placed. Total amount: 29.1.	ORDER	t	2026-02-28 20:33:21.98977
95261847-0129-43ab-8a50-f731e6683f29	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 510444f5-f7cc-45cf-9cdf-fde0fbf283d9 has been placed. Total amount: 6.18.	ORDER	t	2026-02-28 21:38:27.226739
766d0875-15dc-4a55-b54c-f582fd25f1f9	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order d5ccd96e-2f14-464a-8b33-d871ac152019 has been placed. Total amount: 10.33.	ORDER	t	2026-02-28 22:03:52.923321
a810edff-581e-429d-bda5-1c1f2c76d5d6	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order status updated	Order 510444f5-f7cc-45cf-9cdf-fde0fbf283d9 is now OUT_FOR_DELIVERY.	ORDER	t	2026-02-28 22:44:20.420958
b7653903-8a41-43a3-9531-1a50c2138bc6	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 8520bff8-1e07-4d77-b7f5-db61d7e6b306 placed by Mitali Wadkar via AI chat. Total: ₹71.96.	ORDER	f	2026-03-01 00:09:42.850486
bd1e3379-536b-442b-86d6-29e2f261ef98	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 8520bff8-1e07-4d77-b7f5-db61d7e6b306 has been placed. Total amount: 71.96.	ORDER	t	2026-03-01 00:09:42.850486
ec1e74d6-6551-4530-9134-1dd6f3b1cf49	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order b28930d2-54c2-420e-8179-3a80cf741e72 placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	f	2026-03-01 00:37:39.275823
d0cc8833-3704-4375-b90b-5c7198bc41ed	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order b28930d2-54c2-420e-8179-3a80cf741e72 has been placed. Total amount: 2.06.	ORDER	t	2026-03-01 00:37:39.275823
34057aa2-8e9f-46c4-b0a1-87ea86da2191	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order f00b7bbe-8552-467f-aff9-4c5d70d1a819 has been placed. Total amount: 10.3.	ORDER	t	2026-02-28 18:02:32.398435
6355af6f-7d9f-4927-8d00-61723063fdc7	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order c1d5add9-7eb4-4ddb-b735-7e627022fe49 has been placed. Total amount: 6.18.	ORDER	t	2026-02-28 16:14:00.493052
f8143749-6418-4377-ab66-b68d51287b18	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 501fc269-ae82-481a-bbea-adc2fee63c4d has been placed. Total amount: 2.06.	ORDER	t	2026-02-28 16:14:25.049865
050d0de6-6db8-4c86-8ecb-d2b7c50579a9	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 15e6ed1c-ffbe-4954-96f9-ea8c553a1b6a has been placed. Total amount: 24.97.	ORDER	t	2026-02-28 15:06:19.663739
579da318-aa09-4abb-a7ac-d9d591578990	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order dbb2f48d-9a80-45b7-920b-52ec47ca26f4 has been placed. Total amount: 6.18.	ORDER	t	2026-02-28 15:08:40.824491
e1b34ee5-d8ad-4a03-8e1e-87269109ba8c	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 15f1ea74-5c2e-4c36-9fbe-c2cbb7cf35b3 has been placed. Total amount: 2.06.	ORDER	t	2026-02-28 16:18:43.040634
21299648-14f9-4220-af29-519d6addd53b	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 13beea7e-6d34-471b-bfe2-0f7d74856307 has been placed. Total amount: 4.12.	ORDER	t	2026-02-28 15:01:18.515095
437160b7-aaa3-479e-97dd-fda58b31ef3c	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 967540c8-a56e-4314-adff-a5527739c912 has been placed. Total amount: 27.82.	ORDER	t	2026-02-28 08:36:13.412997
009e7834-371c-4ba7-ad72-fc19f4109e33	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 8c617265-2ef9-4c1d-8ece-e6c4805f60cc has been placed. Total amount: 42.81.	ORDER	t	2026-02-28 07:40:42.641692
5a8219e9-6cf2-4820-a33e-ba267246aa0d	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 4dc8beee-35ec-46b1-8b39-4df81d5bf623 has been placed. Total amount: 24.95.	ORDER	t	2026-02-28 07:40:07.08542
fefdef12-c9b6-436a-9e43-6bbc3b0d25bc	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 48e5fde0-663a-4f21-bc14-e5fdbc420cee has been placed. Total amount: 33.9.	ORDER	t	2026-02-28 07:32:08.826998
21f93f8a-dfea-4b02-91a3-c0e162c1f51e	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order dd693d79-82f9-46b0-bc3a-880f51602c33 has been placed. Total amount: 67.97.	ORDER	t	2026-02-28 07:23:22.245209
1614a0b8-2793-4707-a4c7-7e043bf2a4e1	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 1f9b0565-11aa-419a-bedc-d0849215e385 has been placed. Total amount: 42.81.	ORDER	t	2026-02-28 07:21:48.24162
c5385f9c-c56e-4051-9b44-907daaa44bdc	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 56664fff-a250-4ef9-80eb-a2563eb47f18 has been placed. Total amount: 47.77.	ORDER	t	2026-02-28 07:16:58.752282
c645458c-c735-4cc3-a4c2-8e6cda347381	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 9e13a63b-2e39-4169-83c0-ed3aaa8041e4 has been placed. Total amount: 85.62.	ORDER	t	2026-02-28 06:51:36.157714
6696de94-fd03-4055-b9c7-639af7c12856	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order aeb3fca3-fa7f-4fe4-a628-57eee139dc48 has been placed. Total amount: 27.82.	ORDER	t	2026-02-28 00:54:54.290677
542c1acf-9b2a-46bc-9f7b-f74c5ae412fa	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 1222d220-0c93-4ac8-8447-58ecd060e808 has been placed. Total amount: 14.99.	ORDER	t	2026-02-27 21:25:03.672608
abd55805-106f-4bb8-bcc5-0ce0b23e0d10	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order cff654f5-fa63-497b-afed-3ba08caaf846 has been placed. Total amount: 43.66.	ORDER	t	2026-02-27 21:30:15.594728
665b34e7-ffb6-4800-a784-8bc6763238eb	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 7e548610-22db-4427-b331-b596f24f83e9 has been placed. Total amount: 42.81.	ORDER	t	2026-02-28 06:45:06.55109
627be976-f016-475b-bb43-2e4a1e9ddff5	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order b28930d2-54c2-420e-8179-3a80cf741e72 placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	t	2026-03-01 00:37:39.275823
5d1f4792-932e-4817-b458-a31e254ba279	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 8520bff8-1e07-4d77-b7f5-db61d7e6b306 placed by Mitali Wadkar via AI chat. Total: ₹71.96.	ORDER	t	2026-03-01 00:09:42.850486
388ee7de-f94d-4df3-80a1-9fc8ef93d24f	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order e03249eb-c3f8-4b74-8767-35f3034668fd placed by Shravani Kulkarni via AI chat. Total: ₹12.36.	ORDER	f	2026-03-01 02:05:49.094871
53869e3a-782d-4038-a0a1-971537f9eb09	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order dbca70a9-b60d-492c-aa46-360588299df6 placed by Mitali Wadkar via AI chat. Total: ₹29.98.	ORDER	f	2026-03-01 02:07:35.756974
7d2c312f-ffca-4b72-b178-74c524115cef	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order dbca70a9-b60d-492c-aa46-360588299df6 has been placed. Total amount: 29.98.	ORDER	t	2026-03-01 02:07:35.756974
070ed5f1-4da5-4e65-926c-ce9fc21988ca	e89a475d-90c6-4b5f-b938-083f98e811b6	Order placed successfully	Your order e03249eb-c3f8-4b74-8767-35f3034668fd has been placed. Total amount: 12.36.	ORDER	t	2026-03-01 02:05:49.094871
e7025445-4c9b-4f61-bac2-cd5d14a38d65	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order dbca70a9-b60d-492c-aa46-360588299df6 placed by Mitali Wadkar via AI chat. Total: ₹29.98.	ORDER	t	2026-03-01 02:07:35.756974
8d53f779-6655-47b6-bb30-4d209d5e2c21	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order e03249eb-c3f8-4b74-8767-35f3034668fd placed by Shravani Kulkarni via AI chat. Total: ₹12.36.	ORDER	t	2026-03-01 02:05:49.094871
40620a83-d9c7-42bb-96cb-0c8d6ba17846	681f7637-28b1-4b2f-901d-4fec8f739df9	Medicine expiring soon	NORSAN Omega-3 Vegan expires on 2026-03-05. Current stock: 55.	EXPIRING_MEDICINE	f	2026-03-01 03:36:20.19735
6eeab686-6469-4e86-8a4a-752b56b81642	681f7637-28b1-4b2f-901d-4fec8f739df9	Medicine expiring soon	Panthenol Spray 46.3 mg/g expires on 2026-03-03. Current stock: 80.	EXPIRING_MEDICINE	f	2026-03-01 03:36:20.19735
cca3bdd9-2506-46a9-8f04-44c729c4a787	681f7637-28b1-4b2f-901d-4fec8f739df9	Medicine expiring soon	NORSAN Omega-3 Total expires on 2026-03-04. Current stock: 65.	EXPIRING_MEDICINE	f	2026-03-01 03:36:20.19735
3c9078a9-f4a5-4fe4-a7b2-c2afb3f8c9b3	a69a4888-5c71-4469-9972-75d2b92b6900	Medicine expiring soon	NORSAN Omega-3 Vegan expires on 2026-03-05. Current stock: 55.	EXPIRING_MEDICINE	t	2026-03-01 03:36:20.19735
f63ddc16-9bc2-4fe9-b216-5b4e0fe38566	a69a4888-5c71-4469-9972-75d2b92b6900	Medicine expiring soon	NORSAN Omega-3 Total expires on 2026-03-04. Current stock: 65.	EXPIRING_MEDICINE	t	2026-03-01 03:36:20.19735
101eb4ed-55ad-472b-87b8-11d4c6b0fc11	a69a4888-5c71-4469-9972-75d2b92b6900	Medicine expiring soon	Panthenol Spray 46.3 mg/g expires on 2026-03-03. Current stock: 80.	EXPIRING_MEDICINE	t	2026-03-01 03:36:20.19735
6c9440ca-61d5-4fe6-bc41-6f286689d951	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order status updated	Order c92c0d3f-2b1e-461b-a346-48412e3ebeb3 is now CANCELLED.	ORDER	t	2026-03-01 03:50:04.094417
4265c014-71a8-4d02-9118-a79c5ed87273	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order b70d8fa0-f87a-46d7-9e78-ad05726617fe placed by Mitali Wadkar via manual. Total: ₹18.92.	ORDER	f	2026-03-01 05:05:28.065805
e9263a1e-9dab-4d6a-80e3-f02f1ccf4dbd	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order b70d8fa0-f87a-46d7-9e78-ad05726617fe has been placed. Total amount: 18.92.	ORDER	t	2026-03-01 05:05:28.065805
2270c204-720d-4757-ba78-aa3e90f842be	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 2858fe58-b778-47f8-9300-5e4eea6105e1 placed by Mitali Wadkar via manual. Total: ₹36.96.	ORDER	f	2026-03-01 05:24:15.599402
a0a9920f-bb12-4abe-bb27-14d5b3aeb59a	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 2abfa420-4ad4-4b20-9c7f-26f6c4c46cd9 placed by Pranav Khaire  via AI chat. Total: ₹14.99.	ORDER	f	2026-03-01 05:26:24.656469
a29574e0-a751-40ba-b085-4c9a997ee437	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 2abfa420-4ad4-4b20-9c7f-26f6c4c46cd9 has been placed. Total amount: 14.99.	ORDER	t	2026-03-01 05:26:24.656469
1c9dda7e-8d00-4f86-9fa8-9dca4e584f28	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 675e88e5-e033-42d7-b174-e1bc93da4b43 placed by Pranav Khaire  via AI chat. Total: ₹17.99.	ORDER	f	2026-03-01 06:02:11.670911
29a64d0a-906c-40b0-a054-9a697081fd03	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 675e88e5-e033-42d7-b174-e1bc93da4b43 placed by Pranav Khaire  via AI chat. Total: ₹17.99.	ORDER	t	2026-03-01 06:02:11.670911
455d5daa-213b-425e-8c84-5435dbfe968a	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order b70d8fa0-f87a-46d7-9e78-ad05726617fe placed by Mitali Wadkar via manual. Total: ₹18.92.	ORDER	t	2026-03-01 05:05:28.065805
0d93783c-465e-449e-9ee7-08c32f944251	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 2abfa420-4ad4-4b20-9c7f-26f6c4c46cd9 placed by Pranav Khaire  via AI chat. Total: ₹14.99.	ORDER	t	2026-03-01 05:26:24.656469
53bf0247-efcc-428f-a0f3-7d7ef7c32840	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 2858fe58-b778-47f8-9300-5e4eea6105e1 placed by Mitali Wadkar via manual. Total: ₹36.96.	ORDER	t	2026-03-01 05:24:15.599402
f63a09e3-8e7b-40a2-b246-9b5cec74a52c	e89a475d-90c6-4b5f-b938-083f98e811b6	Order placed successfully	Your order 5c061795-bca0-4202-a86c-389d29094594 has been placed. Total amount: 17.99.	ORDER	f	2026-03-01 06:23:24.466489
d1ae0b0f-e752-4a5b-abd5-c494d3e8fbb5	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 5c061795-bca0-4202-a86c-389d29094594 placed by Shravani Kulkarni via AI chat. Total: ₹17.99.	ORDER	f	2026-03-01 06:23:24.466489
476a0395-e9a8-436c-8e77-c6a237ec0901	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 675e88e5-e033-42d7-b174-e1bc93da4b43 has been placed. Total amount: 17.99.	ORDER	t	2026-03-01 06:02:11.670911
60b3f002-1780-4c1f-b539-dc646f13fd73	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order a5717fa8-8564-4943-91b2-c59303a9dc6d has been placed. Total amount: 2.06.	ORDER	f	2026-03-01 06:51:52.889573
946441f5-a1a9-4943-a7d1-f6bbc1d19278	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order a5717fa8-8564-4943-91b2-c59303a9dc6d placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	f	2026-03-01 06:51:52.889573
7e74af87-0148-4af2-a864-38ce9ac59605	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order e39beb63-d314-4fa5-8941-91a6a1134380 has been placed. Total amount: 4.12.	ORDER	f	2026-03-01 06:56:05.538154
4f846eca-9bf7-4305-bae7-2bc4443f4507	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order e39beb63-d314-4fa5-8941-91a6a1134380 placed by Pranav Khaire  via AI chat. Total: ₹4.12.	ORDER	f	2026-03-01 06:56:05.538154
a22adc2c-e0cc-4a26-a2f5-06cb2e2b061f	6fe0760b-0c58-4439-b613-ebae6491f2ca	Order placed successfully	Your order 7b38a297-07f8-4d36-8e6c-5920a4e6f899 has been placed. Total amount: 2.06.	ORDER	f	2026-03-01 06:57:45.045361
d4e699c5-0f5e-44b6-bae1-51ca8c310c72	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 2858fe58-b778-47f8-9300-5e4eea6105e1 has been placed. Total amount: 36.96.	ORDER	t	2026-03-01 05:24:15.599402
8981d392-0daa-4452-b140-38ab6d7b255a	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order e39beb63-d314-4fa5-8941-91a6a1134380 placed by Pranav Khaire  via AI chat. Total: ₹4.12.	ORDER	t	2026-03-01 06:56:05.538154
66f21037-a8a5-4048-b64e-7dc6d91d63f9	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 5c061795-bca0-4202-a86c-389d29094594 placed by Shravani Kulkarni via AI chat. Total: ₹17.99.	ORDER	t	2026-03-01 06:23:24.466489
b6713992-1fd7-4f44-969a-b5ff589f71f7	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order a5717fa8-8564-4943-91b2-c59303a9dc6d placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	t	2026-03-01 06:51:52.889573
d0f48f62-a40f-4bcd-a9e1-7af5cd40b685	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 7b38a297-07f8-4d36-8e6c-5920a4e6f899 placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	f	2026-03-01 06:57:45.045361
da98c0ff-3745-4346-97ed-f2f4227abd00	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 7b38a297-07f8-4d36-8e6c-5920a4e6f899 placed by Pranav Khaire  via AI chat. Total: ₹2.06.	ORDER	t	2026-03-01 06:57:45.045361
f4bbacb8-6502-457c-ae24-6f78803665ae	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order status updated	Order 2858fe58-b778-47f8-9300-5e4eea6105e1 is now CONFIRMED.	ORDER	t	2026-03-05 07:50:45.267165
b1362f92-815e-495e-befa-a35c0974ffb8	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 152ef5a2-e41a-4c24-9343-003a17a4eabd placed by Mitali Wadkar via AI chat. Total: ₹2.06.	ORDER	f	2026-03-05 07:54:01.614619
c52c277b-b45d-414a-b2c9-7b83cdfe0116	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 152ef5a2-e41a-4c24-9343-003a17a4eabd has been placed. Total amount: 2.06.	ORDER	t	2026-03-05 07:54:01.614619
039f6a49-32e3-45f2-9cd6-20981bc023e3	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 7eda7ccd-b06e-4a18-af7b-19e104e9e4df placed by Mitali Wadkar via AI chat. Total: ₹8.24.	ORDER	f	2026-03-08 08:59:19.023286
cb20ef4e-8e64-402b-b00c-a47d6f28c4af	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 7eda7ccd-b06e-4a18-af7b-19e104e9e4df has been placed. Total amount: 8.24.	ORDER	t	2026-03-08 08:59:19.023286
4706c835-0f34-4741-8ed9-e507e6628b3f	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order cc9776a8-305b-4488-bdca-d2340ccda65a placed by Mitali Wadkar via AI chat. Total: ₹4.12.	ORDER	f	2026-03-08 10:43:47.48307
1fb22f15-3cc8-4be3-8e21-45e3546295d0	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order cc9776a8-305b-4488-bdca-d2340ccda65a has been placed. Total amount: 4.12.	ORDER	t	2026-03-08 10:43:47.48307
2ef25f22-1816-431b-b0ca-cb69387c4be9	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order dfe570c0-4597-4d8f-acd0-2939e374b64e placed by Mitali Wadkar via manual. Total: ₹42.81.	ORDER	f	2026-03-14 19:31:01.841644
a62b93e6-943c-4326-8dcc-cbe9fe15c185	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order e6327a15-4d6f-455f-82f8-7f69e472fbc1 placed by Mitali Wadkar via AI chat. Total: ₹14.99.	ORDER	f	2026-03-14 19:31:34.972993
0e960b36-cc3b-46e0-8aa4-5c9c8a21eafa	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 5201e185-7182-44db-b4bc-d74c5ee930ef placed by Mitali Wadkar via AI chat. Total: ₹8.24.	ORDER	f	2026-03-14 19:35:18.060536
509c90b4-2de2-4f9b-b593-d4916bc50be3	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order e6327a15-4d6f-455f-82f8-7f69e472fbc1 has been placed. Total amount: 14.99.	ORDER	t	2026-03-14 19:31:34.972993
e96fb80a-843c-41d3-ad52-9b3dbefe6c3b	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order 5201e185-7182-44db-b4bc-d74c5ee930ef has been placed. Total amount: 8.24.	ORDER	t	2026-03-14 19:35:18.060536
eaa8f65c-7dc1-42a5-a719-eba832c64bd8	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order dfe570c0-4597-4d8f-acd0-2939e374b64e has been placed. Total amount: 42.81.	ORDER	t	2026-03-14 19:31:01.841644
78868b7d-cdf7-4c08-831e-4b7a290cf615	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 7eda7ccd-b06e-4a18-af7b-19e104e9e4df placed by Mitali Wadkar via AI chat. Total: ₹8.24.	ORDER	t	2026-03-08 08:59:19.023286
6e161b1b-c128-4af3-a05e-8ec33dec7d44	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 5201e185-7182-44db-b4bc-d74c5ee930ef placed by Mitali Wadkar via AI chat. Total: ₹8.24.	ORDER	t	2026-03-14 19:35:18.060536
d60df8fd-de97-425a-92fc-dc39f28e3ca3	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order e6327a15-4d6f-455f-82f8-7f69e472fbc1 placed by Mitali Wadkar via AI chat. Total: ₹14.99.	ORDER	t	2026-03-14 19:31:34.972993
2b24ab84-8ead-427c-951e-6d57fa30fdd3	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order cc9776a8-305b-4488-bdca-d2340ccda65a placed by Mitali Wadkar via AI chat. Total: ₹4.12.	ORDER	t	2026-03-08 10:43:47.48307
576b3364-3b54-4980-9952-ee13d8e73e2f	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order dfe570c0-4597-4d8f-acd0-2939e374b64e placed by Mitali Wadkar via manual. Total: ₹42.81.	ORDER	t	2026-03-14 19:31:01.841644
6afa38bd-1fb4-4eb0-aad5-b844b4604262	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 152ef5a2-e41a-4c24-9343-003a17a4eabd placed by Mitali Wadkar via AI chat. Total: ₹2.06.	ORDER	t	2026-03-05 07:54:01.614619
81f7737a-510e-4d8a-a29a-32d5ab1d55f2	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order ddea2414-aa3b-4dd0-9afc-01e0184f1794 placed by Mitali Wadkar via manual. Total: ₹88.30.	ORDER	f	2026-03-14 19:47:34.067747
f7f20c58-b6ff-47aa-8cca-289931bf2a40	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order ddea2414-aa3b-4dd0-9afc-01e0184f1794 placed by Mitali Wadkar via manual. Total: ₹88.30.	ORDER	f	2026-03-14 19:47:34.067747
52498534-d110-4fb0-bcb8-a68b41323e9c	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order status updated	Order dfe570c0-4597-4d8f-acd0-2939e374b64e is now CANCELLED.	ORDER	t	2026-03-14 19:44:41.646264
a61975fa-db96-4581-b493-299bc1f7b3e0	6436d620-a121-4ca9-a9a6-e81c27168bdd	Order placed successfully	Your order ddea2414-aa3b-4dd0-9afc-01e0184f1794 has been placed. Total amount: 88.30.	ORDER	t	2026-03-14 19:47:34.067747
a53add79-9bcd-4a1c-8a91-3353c8689bdb	718166d5-08d9-4b64-83ed-ef0f52f40bb2	Order placed successfully	Your order 19e21775-d17f-4d5c-ab06-4129f9edd67c has been placed. Total amount: 77.86.	ORDER	f	2026-03-14 20:01:53.822748
0c073274-91af-4fb1-b837-48f24f507b3b	681f7637-28b1-4b2f-901d-4fec8f739df9	New order received	Order 19e21775-d17f-4d5c-ab06-4129f9edd67c placed by Parth Kulkarni via manual. Total: ₹77.86.	ORDER	f	2026-03-14 20:01:53.822748
c11dcf30-06e6-45f2-99b9-00451923dceb	a69a4888-5c71-4469-9972-75d2b92b6900	New order received	Order 19e21775-d17f-4d5c-ab06-4129f9edd67c placed by Parth Kulkarni via manual. Total: ₹77.86.	ORDER	f	2026-03-14 20:01:53.822748
\.


--
-- PostgreSQL database dump complete
--

