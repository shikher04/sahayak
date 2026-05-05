"""Seed the database with initial schemes and legal rights data."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, engine, Base
from models import Right, Scheme


SCHEMES: list[dict] = [
    {
        "name": "PM Kisan Samman Nidhi",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "category": "agriculture",
        "level": "central",
        "description": (
            "Direct income support of ₹6,000 per year to all land-holding farmer families having "
            "cultivable land, paid in three equal instalments of ₹2,000 each directly into bank accounts."
        ),
        "benefit_amount": "₹6,000/year",
        "eligibility_criteria": {
            "occupation": ["farmer"],
            "land_ownership": True,
            "exclusions": [
                "Income tax payers",
                "Government employees",
                "Professionals (doctors, engineers, lawyers)",
            ],
        },
        "required_documents": [
            "Aadhaar card",
            "Land ownership records / Khasra-Khatauni",
            "Bank account details",
            "Mobile number",
        ],
        "application_url": "https://pmkisan.gov.in",
    },
    {
        "name": "Ayushman Bharat PM-JAY",
        "ministry": "Ministry of Health & Family Welfare",
        "category": "health",
        "level": "central",
        "description": (
            "World's largest health assurance scheme providing health cover of ₹5 lakh per family "
            "per year for secondary and tertiary care hospitalisation to the bottom 40% of India's population."
        ),
        "benefit_amount": "₹5,00,000/year health cover",
        "eligibility_criteria": {
            "income_bracket": ["below_poverty_line", "low_income"],
            "socio_economic_criteria": "Based on SECC 2011 data",
        },
        "required_documents": [
            "Aadhaar card",
            "Ration card",
            "Income certificate",
            "Caste certificate (if applicable)",
        ],
        "application_url": "https://pmjay.gov.in",
    },
    {
        "name": "PM Awas Yojana - Urban",
        "ministry": "Ministry of Housing & Urban Affairs",
        "category": "housing",
        "level": "central",
        "description": (
            "Housing for All by 2022 mission providing financial assistance for construction of pucca "
            "houses to eligible urban beneficiaries. Subsidy of up to ₹2.67 lakh on home loans."
        ),
        "benefit_amount": "Up to ₹2.67 lakh subsidy",
        "eligibility_criteria": {
            "income_bracket": ["ews", "lig", "mig"],
            "annual_income_limit": "EWS: ₹3L, LIG: ₹6L, MIG-I: ₹12L, MIG-II: ₹18L",
            "no_pucca_house": True,
        },
        "required_documents": [
            "Aadhaar card",
            "Income certificate",
            "Property documents",
            "Bank account details",
        ],
        "application_url": "https://pmaymis.gov.in",
    },
    {
        "name": "PM Awas Yojana - Gramin",
        "ministry": "Ministry of Rural Development",
        "category": "housing",
        "level": "central",
        "description": (
            "Provides financial assistance of ₹1.20 lakh (plain areas) and ₹1.30 lakh (hilly/difficult areas) "
            "for construction of pucca houses to homeless or kutcha/dilapidated house dwellers in rural areas."
        ),
        "benefit_amount": "₹1.20-1.30 lakh",
        "eligibility_criteria": {
            "area": "rural",
            "housing_condition": "homeless or kutcha house",
            "income_bracket": ["below_poverty_line"],
        },
        "required_documents": [
            "Aadhaar card",
            "BPL certificate",
            "Bank account details",
            "Land ownership/lease document",
        ],
        "application_url": "https://pmayg.nic.in",
    },
    {
        "name": "MNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)",
        "ministry": "Ministry of Rural Development",
        "category": "employment",
        "level": "central",
        "description": (
            "Guarantees 100 days of wage employment per financial year to every rural household "
            "whose adult members volunteer to do unskilled manual work. Wage rate is state-specific, "
            "averaging ₹200-350 per day."
        ),
        "benefit_amount": "100 days/year at state wage rate",
        "eligibility_criteria": {
            "area": "rural",
            "age": "adult (18+ years)",
            "willingness": "unskilled manual work",
        },
        "required_documents": [
            "Job Card (issued by Gram Panchayat)",
            "Aadhaar card",
            "Bank account details",
        ],
        "application_url": "https://nrega.nic.in",
    },
    {
        "name": "Sukanya Samriddhi Yojana",
        "ministry": "Ministry of Finance",
        "category": "savings",
        "level": "central",
        "description": (
            "Small deposit savings scheme for girl children below 10 years. Offers high interest rate "
            "(currently 8.2% p.a.) and tax benefits under Section 80C. Account matures when girl turns 21."
        ),
        "benefit_amount": "8.2% interest p.a. + tax benefits",
        "eligibility_criteria": {
            "beneficiary": "girl child",
            "age_limit": "below 10 years",
            "account_per_family": "max 2 girls",
        },
        "required_documents": [
            "Girl child's birth certificate",
            "Parent/guardian Aadhaar card",
            "Parent/guardian PAN card",
            "Address proof",
        ],
        "application_url": "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya.aspx",
    },
    {
        "name": "PM Mudra Yojana",
        "ministry": "Ministry of Finance",
        "category": "loan",
        "level": "central",
        "description": (
            "Provides collateral-free loans to micro and small enterprises. Three categories: "
            "Shishu (up to ₹50,000), Kishore (₹50,001–₹5 lakh), Tarun (₹5 lakh–₹10 lakh). "
            "No processing fee for Shishu loans."
        ),
        "benefit_amount": "Loans up to ₹10 lakh",
        "eligibility_criteria": {
            "business_type": "non-farm income generating activities",
            "enterprise_size": "micro or small",
            "new_or_existing": "both",
        },
        "required_documents": [
            "Aadhaar card",
            "PAN card",
            "Business proof / registration",
            "Bank statements (6 months)",
            "Quotation of machinery/equipment",
        ],
        "application_url": "https://www.mudra.org.in",
    },
    {
        "name": "National Scholarship Portal",
        "ministry": "Ministry of Electronics & IT",
        "category": "education",
        "level": "central",
        "description": (
            "One-stop platform for end-to-end scholarship services covering pre-matric, post-matric, "
            "and merit-cum-means scholarships for SC, ST, OBC, minorities, and economically weaker sections."
        ),
        "benefit_amount": "Varies by scholarship scheme",
        "eligibility_criteria": {
            "caste_category": ["sc", "st", "obc", "minority", "ews"],
            "education_level": "class 1 onwards",
            "income_limit": "varies by scheme",
        },
        "required_documents": [
            "Aadhaar card",
            "Caste certificate",
            "Income certificate",
            "Previous year mark sheet",
            "Bank account details",
            "Institution verification",
        ],
        "application_url": "https://scholarships.gov.in",
    },
    {
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "category": "insurance",
        "level": "central",
        "description": (
            "Crop insurance scheme that provides financial support to farmers suffering crop loss/damage "
            "due to unforeseen events like natural calamities, pests, and diseases. "
            "Premium: Kharif 2%, Rabi 1.5%, commercial/horticultural crops 5%."
        ),
        "benefit_amount": "Full insured amount on crop loss",
        "eligibility_criteria": {
            "occupation": ["farmer"],
            "loan_status": "compulsory for loanee farmers",
        },
        "required_documents": [
            "Land records / Khasra",
            "Bank passbook",
            "Aadhaar card",
            "Sowing certificate",
        ],
        "application_url": "https://pmfby.gov.in",
    },
    {
        "name": "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
        "ministry": "Ministry of Housing & Urban Affairs",
        "category": "loan",
        "level": "central",
        "description": (
            "Micro-credit facility for street vendors to avail affordable working capital loans. "
            "Initial loan ₹10,000; on timely repayment eligible for ₹20,000 then ₹50,000. "
            "Cashback of up to ₹1,200/year on digital transactions."
        ),
        "benefit_amount": "Up to ₹50,000 working capital loan",
        "eligibility_criteria": {
            "occupation": ["street vendor"],
            "area": "urban",
            "vendor_certificate": "Certificate of Vending or LoR",
        },
        "required_documents": [
            "Aadhaar card",
            "Vending certificate or LoR from ULB",
            "Bank account details",
        ],
        "application_url": "https://pmsvanidhi.mohua.gov.in",
    },
    {
        "name": "Beti Bachao Beti Padhao",
        "ministry": "Ministry of Women & Child Development",
        "category": "welfare",
        "level": "central",
        "description": (
            "Campaign addressing the declining child sex ratio and promoting welfare, education, and "
            "participation of the girl child. Implemented in districts with low child sex ratio. "
            "Focuses on preventing gender-biased sex selective elimination."
        ),
        "benefit_amount": "Non-monetary (awareness, education support)",
        "eligibility_criteria": {
            "beneficiary": "girl child",
            "focus_districts": "100+ low CSR districts",
        },
        "required_documents": [
            "Birth certificate of girl child",
        ],
        "application_url": "https://wcd.nic.in/bbbp-schemes",
    },
    {
        "name": "Atal Pension Yojana",
        "ministry": "Ministry of Finance",
        "category": "pension",
        "level": "central",
        "description": (
            "Guaranteed minimum pension scheme for workers in unorganised sector. "
            "Fixed pension of ₹1,000–₹5,000/month at age 60 based on contribution. "
            "Government co-contributes 50% of subscriber's contribution (max ₹1,000/year) for 5 years."
        ),
        "benefit_amount": "₹1,000–₹5,000/month pension",
        "eligibility_criteria": {
            "age": "18-40 years",
            "bank_account": True,
            "income_tax": "not an income tax payer",
            "sector": "unorganised",
        },
        "required_documents": [
            "Aadhaar card",
            "Savings bank account",
            "Mobile number",
        ],
        "application_url": "https://npscra.nsdl.co.in/scheme-details.php",
    },
    {
        "name": "PM Jeevan Jyoti Bima Yojana",
        "ministry": "Ministry of Finance",
        "category": "insurance",
        "level": "central",
        "description": (
            "Term life insurance scheme offering ₹2 lakh life cover for death due to any cause. "
            "Annual premium of just ₹436. Renewable annually. Covers age group 18-50 years."
        ),
        "benefit_amount": "₹2,00,000 life cover",
        "eligibility_criteria": {
            "age": "18-50 years",
            "bank_account": True,
            "aadhaar_linked": True,
        },
        "required_documents": [
            "Savings bank account",
            "Aadhaar card",
        ],
        "application_url": "https://jansuraksha.gov.in",
    },
    {
        "name": "PM Suraksha Bima Yojana",
        "ministry": "Ministry of Finance",
        "category": "insurance",
        "level": "central",
        "description": (
            "Accidental death and disability insurance scheme with ₹2 lakh cover for accidental death "
            "and permanent total disability, ₹1 lakh for partial disability. "
            "Annual premium of just ₹20."
        ),
        "benefit_amount": "₹2,00,000 accident cover",
        "eligibility_criteria": {
            "age": "18-70 years",
            "bank_account": True,
        },
        "required_documents": [
            "Savings bank account",
            "Aadhaar card",
        ],
        "application_url": "https://jansuraksha.gov.in",
    },
    {
        "name": "Soil Health Card Scheme",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "category": "agriculture",
        "level": "central",
        "description": (
            "Provides every farmer a Soil Health Card containing crop-wise recommendations of nutrients "
            "and fertilizers required for individual farms to help improve productivity. "
            "Soil testing done free of cost at government labs."
        ),
        "benefit_amount": "Free soil testing + crop recommendations",
        "eligibility_criteria": {
            "occupation": ["farmer"],
        },
        "required_documents": [
            "Aadhaar card",
            "Land records",
            "Mobile number",
        ],
        "application_url": "https://soilhealth.dac.gov.in",
    },
]

RIGHTS: list[dict] = [
    {
        "title": "Right to Equality",
        "category": "fundamental_rights",
        "description": (
            "Articles 14-18 guarantee equality before law and equal protection of laws. "
            "No discrimination on grounds of religion, race, caste, sex, or place of birth. "
            "Equality of opportunity in public employment. Abolition of untouchability and titles."
        ),
        "articles": [
            {"number": "14", "title": "Equality before law"},
            {"number": "15", "title": "Prohibition of discrimination"},
            {"number": "16", "title": "Equality of opportunity in public employment"},
            {"number": "17", "title": "Abolition of untouchability"},
            {"number": "18", "title": "Abolition of titles"},
        ],
        "action_steps": [
            "File a complaint with the National/State Human Rights Commission",
            "Approach the District Collector or SP for local discrimination",
            "File a writ petition (Article 32) in Supreme Court or High Court",
            "Contact State SC/ST Commission for caste-based discrimination",
        ],
    },
    {
        "title": "Right to Freedom",
        "category": "fundamental_rights",
        "description": (
            "Articles 19-22 protect six fundamental freedoms: speech & expression, assembly, association, "
            "movement, residence, and profession. Also protection against arbitrary arrest and detention. "
            "Right to life and personal liberty under Article 21."
        ),
        "articles": [
            {"number": "19", "title": "Freedom of speech, assembly, movement, profession"},
            {"number": "20", "title": "Protection against self-incrimination"},
            {"number": "21", "title": "Right to life and personal liberty"},
            {"number": "21A", "title": "Right to elementary education"},
            {"number": "22", "title": "Protection against arbitrary arrest"},
        ],
        "action_steps": [
            "If arrested, you have the right to know the grounds of arrest",
            "You must be produced before a magistrate within 24 hours",
            "You have the right to consult a lawyer of your choice",
            "File a Habeas Corpus petition if detained illegally",
        ],
    },
    {
        "title": "Right Against Exploitation",
        "category": "fundamental_rights",
        "description": (
            "Articles 23-24 prohibit human trafficking, forced labour (begar), and employment of children "
            "below 14 years in factories, mines, or hazardous occupations. "
            "Violators can be prosecuted under criminal law."
        ),
        "articles": [
            {"number": "23", "title": "Prohibition of traffic in human beings and forced labour"},
            {"number": "24", "title": "Prohibition of employment of children in hazardous jobs"},
        ],
        "action_steps": [
            "Report child labour to the District Child Labour Inspector",
            "Call Childline 1098 for child protection emergencies",
            "Report trafficking to Anti-Human Trafficking Unit (AHTU) of local police",
            "File complaint under Bonded Labour System (Abolition) Act 1976",
        ],
    },
    {
        "title": "Right to Freedom of Religion",
        "category": "fundamental_rights",
        "description": (
            "Articles 25-28 protect freedom of conscience, free profession, practice and propagation of religion. "
            "Freedom to manage religious affairs. No one can be compelled to pay taxes for promotion of any religion. "
            "No religious instruction in state-funded educational institutions."
        ),
        "articles": [
            {"number": "25", "title": "Freedom of conscience and religion"},
            {"number": "26", "title": "Freedom to manage religious affairs"},
            {"number": "27", "title": "Freedom from religious taxation"},
            {"number": "28", "title": "Freedom from religious instruction in state institutions"},
        ],
        "action_steps": [
            "File complaint with police if religious freedom is violated",
            "Approach National Commission for Minorities for minority rights",
            "File writ petition in High Court under Article 226",
        ],
    },
    {
        "title": "Cultural and Educational Rights",
        "category": "fundamental_rights",
        "description": (
            "Articles 29-30 protect the interests of minorities. Any section of citizens can conserve "
            "their distinct language, script, or culture. Minority institutions have the right to "
            "establish and administer educational institutions of their choice."
        ),
        "articles": [
            {"number": "29", "title": "Protection of interests of minorities"},
            {"number": "30", "title": "Right of minorities to establish educational institutions"},
        ],
        "action_steps": [
            "Approach National Commission for Minority Educational Institutions",
            "Contact state minority welfare department for educational rights",
            "File writ petition if minority institution rights are violated",
        ],
    },
    {
        "title": "Right to Constitutional Remedies",
        "category": "fundamental_rights",
        "description": (
            "Article 32 is the heart of the Constitution — it gives citizens the right to directly approach "
            "the Supreme Court to enforce Fundamental Rights. The Supreme Court can issue writs: Habeas Corpus, "
            "Mandamus, Prohibition, Certiorari, and Quo Warranto."
        ),
        "articles": [
            {"number": "32", "title": "Right to constitutional remedies (Supreme Court)"},
            {"number": "226", "title": "Writ jurisdiction of High Courts"},
        ],
        "action_steps": [
            "File a writ petition in Supreme Court (Article 32) or High Court (Article 226)",
            "Contact Legal Aid Services Authority (NALSA) for free legal aid",
            "Approach a PIL lawyer if the matter is of public interest",
            "Toll-free legal aid: 15100",
        ],
    },
    {
        "title": "Right to Information (RTI)",
        "category": "statutory_rights",
        "description": (
            "The RTI Act 2005 empowers every citizen to request information from any public authority. "
            "The authority must respond within 30 days (48 hours for life/liberty matters). "
            "Application fee is ₹10. BPL applicants are exempt from fee."
        ),
        "articles": [
            {"number": "RTI Act 2005", "title": "Right to Information Act"},
            {"number": "Section 6", "title": "Filing an RTI application"},
            {"number": "Section 19", "title": "First and second appeal"},
        ],
        "action_steps": [
            "Write RTI application to the Public Information Officer (PIO) of the concerned department",
            "Pay ₹10 fee (by cash, demand draft, or Indian Postal Order)",
            "If no response in 30 days, file First Appeal with First Appellate Authority",
            "If still unresolved, file Second Appeal with Central/State Information Commission",
            "Online RTI portal: https://rtionline.gov.in",
        ],
    },
    {
        "title": "Consumer Rights",
        "category": "statutory_rights",
        "description": (
            "The Consumer Protection Act 2019 protects against unfair trade practices. "
            "Six consumer rights: safety, information, choice, hearing, redressal, and consumer education. "
            "File complaints with District (up to ₹1 cr), State (₹1-10 cr), or National (above ₹10 cr) Consumer Commission."
        ),
        "articles": [
            {"number": "CPA 2019", "title": "Consumer Protection Act 2019"},
            {"number": "Section 2(7)", "title": "Definition of consumer"},
            {"number": "Section 35", "title": "Filing consumer complaint"},
        ],
        "action_steps": [
            "Try to resolve with the seller/service provider first (send registered notice)",
            "File online complaint at https://consumerhelpline.gov.in (National Consumer Helpline: 1800-11-4000)",
            "File complaint in District Consumer Commission (for claims up to ₹1 crore)",
            "Keep all purchase records, bills, warranties as evidence",
        ],
    },
    {
        "title": "Women's Rights",
        "category": "women_rights",
        "description": (
            "Multiple laws protect women's rights: PWDVA 2005 (domestic violence), POSH Act 2013 "
            "(sexual harassment at workplace), Maternity Benefit Act 1961 (26 weeks paid maternity leave), "
            "Dowry Prohibition Act 1961, and IPC provisions against rape and assault."
        ),
        "articles": [
            {"number": "PWDVA 2005", "title": "Protection of Women from Domestic Violence Act"},
            {"number": "POSH 2013", "title": "Prevention of Sexual Harassment at Workplace"},
            {"number": "MBA 1961", "title": "Maternity Benefit Act (26 weeks leave)"},
            {"number": "IPC 498A", "title": "Cruelty by husband or his relatives"},
        ],
        "action_steps": [
            "For domestic violence: Contact Protection Officer (District Women & Child Development Office)",
            "For workplace harassment: Approach Internal Complaints Committee (ICC) of your employer",
            "Women helpline: 181 | Police: 100 | NCW helpline: 7827170170",
            "File complaint with National Commission for Women: http://ncwapps.nic.in",
        ],
    },
    {
        "title": "Right to Education",
        "category": "statutory_rights",
        "description": (
            "Article 21A and RTE Act 2009 make free and compulsory education a fundamental right for "
            "children aged 6-14 years. 25% seats in private schools must be reserved for EWS/disadvantaged "
            "children (Section 12(1)(c)). No capitation fees or screening of children/parents allowed."
        ),
        "articles": [
            {"number": "21A", "title": "Right to free and compulsory elementary education"},
            {"number": "RTE Act 2009", "title": "Right of Children to Free and Compulsory Education"},
            {"number": "Section 12(1)(c)", "title": "25% EWS reservation in private schools"},
        ],
        "action_steps": [
            "Apply for 25% EWS quota admission through state's online portal",
            "Contact District Education Officer if child is denied admission",
            "File complaint with State Commission for Protection of Child Rights (SCPCR)",
            "National helpline for RTE: 1800-180-9980",
        ],
    },
]


async def seed_schemes(session: AsyncSession) -> None:
    await session.execute(delete(Scheme))
    for data in SCHEMES:
        scheme = Scheme(**data)
        session.add(scheme)
    await session.commit()
    print(f"✓ Seeded {len(SCHEMES)} schemes")


async def seed_rights(session: AsyncSession) -> None:
    await session.execute(delete(Right))
    for data in RIGHTS:
        right = Right(**data)
        session.add(right)
    await session.commit()
    print(f"✓ Seeded {len(RIGHTS)} rights")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed_schemes(session)
        await seed_rights(session)
    await engine.dispose()
    print("✓ Seed complete")


if __name__ == "__main__":
    asyncio.run(main())
