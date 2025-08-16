const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

// Sample restaurants data for La Réunion
const sampleRestaurants = [
    {
        name: "Chez Tante Marie",
        description: "Cuisine créole authentique avec des recettes familiales transmises de génération en génération. Spécialités: cari poulet, rougail saucisse, samosas.",
        cuisine: "Créole",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
        address: {
            street: "15 Rue de la République",
            city: "Saint-Denis",
            postalCode: "97400",
            zone: "Nord"
        },
        contact: {
            phone: "+262 262 12 34 56",
            email: "contact@cheztantemarie.re",
            website: "https://cheztantemarie.re"
        },
        operatingHours: {
            monday: { open: "11:00", close: "22:00", closed: false },
            tuesday: { open: "11:00", close: "22:00", closed: false },
            wednesday: { open: "11:00", close: "22:00", closed: false },
            thursday: { open: "11:00", close: "22:00", closed: false },
            friday: { open: "11:00", close: "23:00", closed: false },
            saturday: { open: "11:00", close: "23:00", closed: false },
            sunday: { open: "11:00", close: "22:00", closed: false }
        },
        deliveryZones: ["Nord", "Saint-Denis", "Sainte-Marie"],
        deliveryFee: 3.50,
        minimumOrder: 15.00,
        menu: [
            {
                category: "Plats Principaux",
                items: [
                    {
                        name: "Cari Poulet",
                        description: "Cari de poulet traditionnel avec riz blanc et grains",
                        price: 12.50,
                        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300",
                        available: true,
                        spicy: true,
                        vegetarian: false,
                        vegan: false
                    },
                    {
                        name: "Rougail Saucisse",
                        description: "Saucisses fumées aux tomates et piments, riz et grains",
                        price: 11.00,
                        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300",
                        available: true,
                        spicy: true,
                        vegetarian: false,
                        vegan: false
                    },
                    {
                        name: "Cari Lentilles",
                        description: "Cari de lentilles aux légumes du pays",
                        price: 9.50,
                        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: true
                    }
                ]
            },
            {
                category: "Entrées",
                items: [
                    {
                        name: "Samosas (x6)",
                        description: "Samosas aux légumes croustillants",
                        price: 6.00,
                        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    },
                    {
                        name: "Bouchons (x4)",
                        description: "Petits pains vapeur à la viande",
                        price: 5.50,
                        image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            },
            {
                category: "Desserts",
                items: [
                    {
                        name: "Gâteau Patate Douce",
                        description: "Gâteau traditionnel à la patate douce",
                        price: 4.50,
                        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    }
                ]
            }
        ],
        rating: { average: 4.8, count: 156 },
        status: "active",
        featured: true,
        tags: ["Créole", "Authentique", "Familial", "Épicé"],
        socialMedia: {
            facebook: "https://facebook.com/cheztantemarie",
            instagram: "https://instagram.com/cheztantemarie",
            whatsapp: "+262692123456"
        }
    },
    {
        name: "Le Jardin Tropical",
        description: "Restaurant gastronomique mettant en valeur les produits locaux avec une touche moderne. Vue panoramique sur l'océan.",
        cuisine: "Gastronomique",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500",
        address: {
            street: "25 Boulevard de l'Océan",
            city: "Saint-Gilles",
            postalCode: "97434",
            zone: "Ouest"
        },
        contact: {
            phone: "+262 262 24 35 67",
            email: "reservation@jardintropical.re",
            website: "https://jardintropical.re"
        },
        operatingHours: {
            monday: { open: "", close: "", closed: true },
            tuesday: { open: "18:00", close: "23:00", closed: false },
            wednesday: { open: "18:00", close: "23:00", closed: false },
            thursday: { open: "18:00", close: "23:00", closed: false },
            friday: { open: "18:00", close: "23:30", closed: false },
            saturday: { open: "18:00", close: "23:30", closed: false },
            sunday: { open: "18:00", close: "22:30", closed: false }
        },
        deliveryZones: ["Ouest", "Saint-Gilles", "L'Hermitage"],
        deliveryFee: 5.00,
        minimumOrder: 25.00,
        menu: [
            {
                category: "Entrées",
                items: [
                    {
                        name: "Carpaccio de Bonite",
                        description: "Fines tranches de bonite, vinaigrette aux agrumes locaux",
                        price: 16.00,
                        image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            },
            {
                category: "Plats Principaux",
                items: [
                    {
                        name: "Dorade à la Vanille Bourbon",
                        description: "Dorade grillée, sauce vanille Bourbon, légumes du jardin",
                        price: 28.00,
                        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    },
                    {
                        name: "Médaillon de Bœuf aux Épices",
                        description: "Bœuf local aux épices créoles, gratin de patate douce",
                        price: 32.00,
                        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300",
                        available: true,
                        spicy: true,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            }
        ],
        rating: { average: 4.6, count: 89 },
        status: "active",
        featured: true,
        tags: ["Gastronomique", "Vue mer", "Produits locaux", "Romantique"],
        socialMedia: {
            facebook: "https://facebook.com/jardintropical",
            instagram: "https://instagram.com/jardintropical"
        }
    },
    {
        name: "Pizza Corner 974",
        description: "Pizzas artisanales avec des ingrédients frais et locaux. Pâte fait maison quotidiennement.",
        cuisine: "Italien",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
        address: {
            street: "8 Rue du Commerce",
            city: "Saint-Pierre",
            postalCode: "97410",
            zone: "Sud"
        },
        contact: {
            phone: "+262 262 25 36 78",
            email: "commande@pizzacorner974.re"
        },
        operatingHours: {
            monday: { open: "17:00", close: "22:30", closed: false },
            tuesday: { open: "17:00", close: "22:30", closed: false },
            wednesday: { open: "17:00", close: "22:30", closed: false },
            thursday: { open: "17:00", close: "22:30", closed: false },
            friday: { open: "17:00", close: "23:00", closed: false },
            saturday: { open: "17:00", close: "23:00", closed: false },
            sunday: { open: "17:00", close: "22:30", closed: false }
        },
        deliveryZones: ["Sud", "Saint-Pierre", "Le Tampon"],
        deliveryFee: 2.50,
        minimumOrder: 12.00,
        menu: [
            {
                category: "Pizzas Classiques",
                items: [
                    {
                        name: "Pizza Margherita",
                        description: "Tomate, mozzarella, basilic frais",
                        price: 11.50,
                        image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    },
                    {
                        name: "Pizza Reine",
                        description: "Tomate, mozzarella, jambon, champignons",
                        price: 13.50,
                        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            },
            {
                category: "Pizzas Spéciales 974",
                items: [
                    {
                        name: "Pizza Tropicale",
                        description: "Tomate, mozzarella, ananas local, jambon fumé",
                        price: 15.00,
                        image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    },
                    {
                        name: "Pizza Créole",
                        description: "Base rougail, mozzarella, saucisse fumée, piments",
                        price: 16.50,
                        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300",
                        available: true,
                        spicy: true,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            }
        ],
        rating: { average: 4.4, count: 203 },
        status: "active",
        featured: false,
        tags: ["Pizza", "Artisanal", "Livraison rapide", "Fait maison"],
        socialMedia: {
            facebook: "https://facebook.com/pizzacorner974",
            whatsapp: "+262692253678"
        }
    },
    {
        name: "Sushi Zen",
        description: "Sushi bar moderne avec poissons ultra-frais de l'océan Indien. Fusion japonaise-créole unique.",
        cuisine: "Japonais",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500",
        address: {
            street: "12 Avenue de la Plage",
            city: "Saint-Paul",
            postalCode: "97460",
            zone: "Ouest"
        },
        contact: {
            phone: "+262 262 33 44 55",
            email: "commande@sushizen.re"
        },
        operatingHours: {
            monday: { open: "", close: "", closed: true },
            tuesday: { open: "18:00", close: "22:00", closed: false },
            wednesday: { open: "18:00", close: "22:00", closed: false },
            thursday: { open: "18:00", close: "22:00", closed: false },
            friday: { open: "18:00", close: "22:30", closed: false },
            saturday: { open: "18:00", close: "22:30", closed: false },
            sunday: { open: "18:00", close: "22:00", closed: false }
        },
        deliveryZones: ["Ouest", "Saint-Paul", "Le Port"],
        deliveryFee: 4.00,
        minimumOrder: 20.00,
        menu: [
            {
                category: "Sushi & Sashimi",
                items: [
                    {
                        name: "Plateau Découverte (12 pièces)",
                        description: "Assortiment de sushi et maki variés",
                        price: 24.00,
                        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    },
                    {
                        name: "Sashimi Bonite (6 pièces)",
                        description: "Sashimi de bonite fraîche de l'océan Indien",
                        price: 18.00,
                        image: "https://images.unsplash.com/photo-1606943533894-7e8c7d4e6e49?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            },
            {
                category: "Spécialités Fusion",
                items: [
                    {
                        name: "Maki Créole",
                        description: "Maki au thon épicé, avocat, piment confit",
                        price: 14.00,
                        image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300",
                        available: true,
                        spicy: true,
                        vegetarian: false,
                        vegan: false
                    }
                ]
            }
        ],
        rating: { average: 4.7, count: 134 },
        status: "active",
        featured: true,
        tags: ["Sushi", "Poisson frais", "Fusion", "Moderne"],
        socialMedia: {
            instagram: "https://instagram.com/sushizen974"
        }
    },
    {
        name: "Le Glacier des Hauts",
        description: "Glacier artisanal avec des parfums locaux uniques. Glaces et sorbets aux fruits tropicaux de La Réunion.",
        cuisine: "Desserts",
        image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500",
        address: {
            street: "5 Place du Marché",
            city: "Cilaos",
            postalCode: "97413",
            zone: "Cirques"
        },
        contact: {
            phone: "+262 262 31 78 90",
            email: "info@glacierdeshauts.re"
        },
        operatingHours: {
            monday: { open: "10:00", close: "19:00", closed: false },
            tuesday: { open: "10:00", close: "19:00", closed: false },
            wednesday: { open: "10:00", close: "19:00", closed: false },
            thursday: { open: "10:00", close: "19:00", closed: false },
            friday: { open: "10:00", close: "20:00", closed: false },
            saturday: { open: "10:00", close: "20:00", closed: false },
            sunday: { open: "10:00", close: "19:00", closed: false }
        },
        deliveryZones: ["Cirques", "Cilaos", "Entre-Deux"],
        deliveryFee: 6.00,
        minimumOrder: 10.00,
        menu: [
            {
                category: "Glaces Artisanales",
                items: [
                    {
                        name: "Glace Vanille Bourbon",
                        description: "Glace à la vanille Bourbon de La Réunion",
                        price: 3.50,
                        image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    },
                    {
                        name: "Sorbet Letchi",
                        description: "Sorbet aux letchis frais de saison",
                        price: 3.50,
                        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: true
                    },
                    {
                        name: "Glace Coco-Rhum",
                        description: "Glace coco avec une pointe de rhum arrangé",
                        price: 4.00,
                        image: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    }
                ]
            },
            {
                category: "Desserts Glacés",
                items: [
                    {
                        name: "Coupe Tropicale",
                        description: "3 boules au choix, fruits exotiques, chantilly",
                        price: 8.50,
                        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300",
                        available: true,
                        spicy: false,
                        vegetarian: true,
                        vegan: false
                    }
                ]
            }
        ],
        rating: { average: 4.9, count: 78 },
        status: "active",
        featured: false,
        tags: ["Glace artisanale", "Parfums locaux", "Desserts", "Familial"],
        socialMedia: {
            facebook: "https://facebook.com/glacierdeshauts"
        }
    }
];

// Function to seed the database
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tikaz-livre', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('📊 Connected to MongoDB for seeding...');

        // Clear existing restaurants
        await Restaurant.deleteMany({});
        console.log('🗑️ Cleared existing restaurants');

        // Insert sample restaurants
        const insertedRestaurants = await Restaurant.insertMany(sampleRestaurants);
        console.log(`✅ Inserted ${insertedRestaurants.length} restaurants`);

        console.log('🎉 Database seeding completed successfully!');

        // List inserted restaurants
        insertedRestaurants.forEach(restaurant => {
            console.log(`  - ${restaurant.name} (${restaurant.cuisine}) - ID: ${restaurant._id}`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Database seeding error:', error);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { sampleRestaurants, seedDatabase };
