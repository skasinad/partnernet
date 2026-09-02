"""
Populate the database with a realistic demo dataset.

    python manage.py seed            # add reference data + demo businesses
    python manage.py seed --wipe     # delete demo data first, then reseed

Every demo owner uses the password "partnernet-demo".
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from businesses.models import Business
from catalog.models import AudienceTag, Category
from messaging.models import Message, Thread
from partnerships.models import Connection, PartnershipRequest

User = get_user_model()

DEMO_PASSWORD = "partnernet-demo"

CATEGORIES = [
    "Coffee & Cafe", "Bookshop", "Bakery", "Yoga Studio", "Juice Bar",
    "Wellness Spa", "Gym & Fitness", "Sports Nutrition", "Hair Salon",
    "Nail Salon", "Boutique Clothing", "Jewelry", "Florist", "Event Planning",
    "Wedding Photography", "Pet Grooming", "Pet Supplies", "Craft Brewery",
    "Pizzeria", "Record Store", "Stationery", "Interior Design",
    "Furniture Store", "Coworking Space",
]

TAGS = {
    "age": ["Gen Z (18-24)", "Young professionals (25-34)", "Established (35-49)",
            "Parents of young kids", "50+"],
    "interest": ["Health & wellness", "Sustainability", "Local & handmade",
                 "Design-led", "Foodies", "Fitness", "Live music", "Weddings",
                 "Remote workers", "Pet owners"],
    "price": ["Budget-friendly", "Mid-range spenders", "Premium buyers"],
    "lifestyle": ["Urban dwellers", "Suburban families", "Students",
                  "Creative freelancers", "Early risers"],
}

BUSINESSES = [
    dict(name="Rowan & Bean", cat="Coffee & Cafe", city="Portland", region="Oregon",
         lat=45.523, lng=-122.676, price="mid", size="micro",
         tagline="Single-origin espresso and slow mornings on Alberta St.",
         tags=["Young professionals (25-34)", "Design-led", "Foodies",
               "Remote workers", "Mid-range spenders", "Urban dwellers"],
         pitch="Looking to co-host tasting events and cross-promote with nearby "
               "makers who care about craft."),
    dict(name="Margin Notes Books", cat="Bookshop", city="Portland", region="Oregon",
         lat=45.531, lng=-122.665, price="mid", size="micro",
         tagline="An independent bookshop with a strong staff-picks wall.",
         tags=["Young professionals (25-34)", "Design-led", "Local & handmade",
               "Remote workers", "Mid-range spenders", "Urban dwellers"],
         pitch="Keen to run a book-and-coffee morning series and share a "
               "newsletter slot with a local cafe."),
    dict(name="Proof Bakery Co.", cat="Bakery", city="Portland", region="Oregon",
         lat=45.519, lng=-122.681, price="mid", size="micro",
         tagline="Naturally leavened bread and laminated pastry, baked daily.",
         tags=["Parents of young kids", "Foodies", "Local & handmade",
               "Mid-range spenders", "Suburban families"],
         pitch="Wholesale pastry partnerships with cafes plus joint weekend "
               "pop-ups."),
    dict(name="Still Point Yoga", cat="Yoga Studio", city="Austin", region="Texas",
         lat=30.267, lng=-97.743, price="premium", size="small",
         tagline="Vinyasa and restorative classes in a light-filled studio.",
         tags=["Young professionals (25-34)", "Health & wellness", "Fitness",
               "Premium buyers", "Urban dwellers", "Early risers"],
         pitch="Want to bundle memberships with a juice bar and a wellness spa "
               "for a 'reset' package."),
    dict(name="Cold Press Collective", cat="Juice Bar", city="Austin", region="Texas",
         lat=30.271, lng=-97.741, price="premium", size="micro",
         tagline="Organic cold-pressed juice and adaptogenic smoothies.",
         tags=["Young professionals (25-34)", "Health & wellness", "Fitness",
               "Premium buyers", "Urban dwellers", "Early risers"],
         pitch="Post-class juice deals with studios and gyms; shared loyalty "
               "punch card."),
    dict(name="Cedar & Sage Spa", cat="Wellness Spa", city="Austin", region="Texas",
         lat=30.264, lng=-97.747, price="premium", size="small",
         tagline="Massage, facials, and infrared sauna in a calm setting.",
         tags=["Established (35-49)", "Health & wellness", "Premium buyers",
               "Urban dwellers"],
         pitch="Cross-refer with fitness and yoga studios; co-branded "
               "self-care gift sets."),
    dict(name="Ironwood Strength", cat="Gym & Fitness", city="Denver",
         region="Colorado", lat=39.739, lng=-104.990, price="mid", size="small",
         tagline="Small-group strength coaching, no lines, no ego.",
         tags=["Young professionals (25-34)", "Fitness", "Health & wellness",
               "Mid-range spenders", "Urban dwellers", "Early risers"],
         pitch="Nutrition partner for members plus a shared challenge event "
               "each quarter."),
    dict(name="Basecamp Nutrition", cat="Sports Nutrition", city="Denver",
         region="Colorado", lat=39.742, lng=-104.985, price="mid", size="micro",
         tagline="Supplements and fuel picked by actual coaches.",
         tags=["Young professionals (25-34)", "Fitness", "Health & wellness",
               "Mid-range spenders", "Urban dwellers"],
         pitch="In-gym pop-up shop and member discount codes."),
    dict(name="The Mane Room", cat="Hair Salon", city="Nashville", region="Tennessee",
         lat=36.162, lng=-86.781, price="premium", size="micro",
         tagline="Lived-in color and precision cuts in the Gulch.",
         tags=["Young professionals (25-34)", "Design-led", "Premium buyers",
               "Weddings", "Urban dwellers"],
         pitch="Bridal-party packages with a photographer and a florist."),
    dict(name="Polish Bar Nashville", cat="Nail Salon", city="Nashville",
         region="Tennessee", lat=36.159, lng=-86.778, price="mid", size="micro",
         tagline="Clean-air manicures and long-wear gel.",
         tags=["Gen Z (18-24)", "Young professionals (25-34)", "Design-led",
               "Weddings", "Mid-range spenders", "Urban dwellers"],
         pitch="Get-ready packages with salons for weddings and events."),
    dict(name="Field Day Goods", cat="Boutique Clothing", city="Nashville",
         region="Tennessee", lat=36.157, lng=-86.784, price="premium", size="micro",
         tagline="Independent labels and sturdy everyday basics.",
         tags=["Young professionals (25-34)", "Design-led", "Sustainability",
               "Local & handmade", "Premium buyers", "Urban dwellers"],
         pitch="Trunk shows with a local jeweler; styled shoots with a "
               "photographer."),
    dict(name="Rill Jewelry", cat="Jewelry", city="Nashville", region="Tennessee",
         lat=36.155, lng=-86.786, price="premium", size="solo",
         tagline="Hand-fabricated fine jewelry, made to be worn daily.",
         tags=["Established (35-49)", "Design-led", "Local & handmade",
               "Weddings", "Premium buyers", "Urban dwellers"],
         pitch="Engagement-ring clients need photographers and florists; happy "
               "to refer both ways."),
    dict(name="Fern Street Florist", cat="Florist", city="Seattle",
         region="Washington", lat=47.606, lng=-122.332, price="mid", size="micro",
         tagline="Seasonal, garden-style arrangements and weekly bouquets.",
         tags=["Established (35-49)", "Weddings", "Design-led", "Sustainability",
               "Mid-range spenders", "Urban dwellers"],
         pitch="Preferred-vendor list swaps with planners and photographers."),
    dict(name="Knot & Co. Events", cat="Event Planning", city="Seattle",
         region="Washington", lat=47.609, lng=-122.335, price="premium", size="micro",
         tagline="Full-service planning for weddings and milestone parties.",
         tags=["Established (35-49)", "Weddings", "Premium buyers",
               "Design-led", "Urban dwellers"],
         pitch="Building a trusted vendor bench: florals, photo, hair, cake."),
    dict(name="Anna Lind Photography", cat="Wedding Photography", city="Seattle",
         region="Washington", lat=47.603, lng=-122.329, price="premium", size="solo",
         tagline="Documentary-style wedding and elopement photography.",
         tags=["Established (35-49)", "Weddings", "Design-led", "Premium buyers"],
         pitch="Referral partnerships with planners, florists, and venues."),
    dict(name="Two Dogs Grooming", cat="Pet Grooming", city="Minneapolis",
         region="Minnesota", lat=44.978, lng=-93.265, price="mid", size="micro",
         tagline="Low-stress grooming for dogs and the occasional brave cat.",
         tags=["Parents of young kids", "Pet owners", "Local & handmade",
               "Mid-range spenders", "Suburban families"],
         pitch="Co-marketing with a pet-supply shop; shared adoption-day events."),
    dict(name="North Loop Pet Supply", cat="Pet Supplies", city="Minneapolis",
         region="Minnesota", lat=44.985, lng=-93.276, price="mid", size="micro",
         tagline="Small-batch food, toys, and gear for city pets.",
         tags=["Young professionals (25-34)", "Pet owners", "Sustainability",
               "Mid-range spenders", "Urban dwellers"],
         pitch="Bundle a grooming voucher with new-puppy starter kits."),
    dict(name="Third Coast Brewing", cat="Craft Brewery", city="Chicago",
         region="Illinois", lat=41.878, lng=-87.629, price="mid", size="small",
         tagline="Hazy IPAs and crisp lagers in a dog-friendly taproom.",
         tags=["Gen Z (18-24)", "Young professionals (25-34)", "Live music",
               "Foodies", "Mid-range spenders", "Urban dwellers"],
         pitch="Rotating food partner in the taproom plus co-hosted gig nights."),
    dict(name="Slice Theory", cat="Pizzeria", city="Chicago", region="Illinois",
         lat=41.881, lng=-87.632, price="budget", size="micro",
         tagline="Thin-crust by the slice, open late.",
         tags=["Gen Z (18-24)", "Young professionals (25-34)", "Foodies",
               "Live music", "Budget-friendly", "Students", "Urban dwellers"],
         pitch="Pop-up nights at breweries and venues; student discount tie-ins."),
    dict(name="Groove Merchant Records", cat="Record Store", city="Chicago",
         region="Illinois", lat=41.884, lng=-87.627, price="mid", size="solo",
         tagline="Used vinyl, new pressings, and in-store sets.",
         tags=["Gen Z (18-24)", "Young professionals (25-34)", "Live music",
               "Local & handmade", "Mid-range spenders", "Urban dwellers"],
         pitch="Co-host listening parties with a brewery; cross-sell gig tickets."),
    dict(name="Foxglove Paper Co.", cat="Stationery", city="Portland",
         region="Oregon", lat=45.517, lng=-122.679, price="mid", size="solo",
         tagline="Letterpress cards and desk goods, made in-house.",
         tags=["Young professionals (25-34)", "Design-led", "Local & handmade",
               "Weddings", "Mid-range spenders", "Urban dwellers"],
         pitch="Wedding-invite referrals with planners; shelf space in a bookshop."),
    dict(name="Studio Hearth Interiors", cat="Interior Design", city="Austin",
         region="Texas", lat=30.269, lng=-97.749, price="premium", size="micro",
         tagline="Warm, collected interiors for real family life.",
         tags=["Established (35-49)", "Design-led", "Premium buyers",
               "Suburban families"],
         pitch="Source from local furniture makers; joint 'refresh a room' events."),
    dict(name="Grainwell Furniture", cat="Furniture Store", city="Austin",
         region="Texas", lat=30.275, lng=-97.738, price="premium", size="small",
         tagline="Solid-wood furniture built to outlast trends.",
         tags=["Established (35-49)", "Design-led", "Sustainability",
               "Premium buyers", "Suburban families"],
         pitch="Trade program for designers plus co-branded showroom nights."),
    dict(name="The Commons Coworking", cat="Coworking Space", city="Denver",
         region="Colorado", lat=39.745, lng=-104.999, price="mid", size="small",
         tagline="Quiet desks, good coffee, and a rooftop for calls.",
         tags=["Creative freelancers", "Remote workers", "Design-led",
               "Mid-range spenders", "Urban dwellers"],
         pitch="Member perks with a nearby cafe and gym; host maker markets."),
]


class Command(BaseCommand):
    help = "Seed the database with demo data."

    def add_arguments(self, parser):
        parser.add_argument("--wipe", action="store_true",
                            help="Delete existing demo data before seeding.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["wipe"]:
            self.stdout.write("Wiping demo data...")
            User.objects.filter(email__endswith="@demo.partnernet.app").delete()
            Category.objects.all().delete()
            AudienceTag.objects.all().delete()

        cats = {name: Category.objects.get_or_create(name=name)[0] for name in CATEGORIES}
        tags: dict[str, AudienceTag] = {}
        for facet, names in TAGS.items():
            for name in names:
                tag, _ = AudienceTag.objects.get_or_create(facet=facet, name=name)
                tags[name] = tag
        self.stdout.write(self.style.SUCCESS(
            f"Reference data: {len(cats)} categories, {len(tags)} tags"))

        by_name: dict[str, Business] = {}
        for spec in BUSINESSES:
            slug_email = spec["name"].lower().replace(" ", "").replace("&", "").replace(".", "")
            email = f"{slug_email}@demo.partnernet.app"
            owner, created = User.objects.get_or_create(
                email=email, defaults={"full_name": f"{spec['name']} Owner"}
            )
            if created:
                owner.set_password(DEMO_PASSWORD)
                owner.save()

            biz, _ = Business.objects.update_or_create(
                owner=owner,
                defaults=dict(
                    name=spec["name"], category=cats[spec["cat"]],
                    tagline=spec["tagline"],
                    description=spec["tagline"] + " " + spec["pitch"],
                    price_tier=spec["price"], size=spec["size"],
                    city=spec["city"], region=spec["region"],
                    latitude=spec["lat"], longitude=spec["lng"],
                    open_to_partnerships=True, partnership_pitch=spec["pitch"],
                    contact_email=email,
                ),
            )
            biz.audience_tags.set([tags[t] for t in spec["tags"] if t in tags])
            by_name[spec["name"]] = biz
        self.stdout.write(self.style.SUCCESS(f"Businesses: {len(by_name)}"))

        self._seed_relationships(by_name)
        self.stdout.write(self.style.SUCCESS(
            "Done. Log in with any demo email + password 'partnernet-demo'."))

    def _seed_relationships(self, biz):
        def request(a, b, message, status="pending"):
            r, _ = PartnershipRequest.objects.get_or_create(
                from_business=biz[a], to_business=biz[b],
                defaults={"message": message, "status": status},
            )
            if status == "accepted":
                r.status = "accepted"
                r.responded_at = timezone.now()
                r.save()
                Connection.create_for(biz[a], biz[b], request=r)
            return r

        request("Rowan & Bean", "Margin Notes Books",
                "Love your staff-picks wall. Want to try a Saturday "
                "'book & pour-over' morning next month?", status="accepted")
        request("Still Point Yoga", "Cold Press Collective",
                "Our members keep asking where to get a good post-class juice. "
                "Bundle idea attached.", status="accepted")
        request("Knot & Co. Events", "Anna Lind Photography",
                "Building our 2026 preferred-vendor list and your work is "
                "exactly the style our couples ask for.", status="accepted")
        request("Ironwood Strength", "Basecamp Nutrition",
                "Want to run a joint 6-week strength + nutrition challenge?")
        request("The Mane Room", "Rill Jewelry",
                "Bridal parties in, jewelry clients out - seems like an obvious "
                "referral loop.")
        request("Third Coast Brewing", "Slice Theory",
                "Taproom needs a food partner on weekends. Interested in a "
                "standing Friday slot?")
        request("Fern Street Florist", "Knot & Co. Events",
                "We'd love to be on your floral shortlist for next season.")

        # A short conversation on one accepted connection.
        thread, _ = Thread.get_or_create_between(
            biz["Rowan & Bean"], biz["Margin Notes Books"])
        if not thread.messages.exists():
            Message.objects.create(thread=thread, sender=biz["Rowan & Bean"],
                                   body="Thinking the second Saturday of the month, "
                                        "8-11am. We'll bring a pour-over bar.")
            Message.objects.create(thread=thread, sender=biz["Margin Notes Books"],
                                   body="Perfect. We'll build a little display table "
                                        "of coffee-and-food books next to it.")
            Message.objects.create(thread=thread, sender=biz["Rowan & Bean"],
                                   body="Deal. I'll draft a shared post for both "
                                        "newsletters this week.")
