import { db } from "../../database/dbClient";
import { Dish } from "../../src/shared/types";

const DEMO_USER_ID = "u_demo";

const DEMO_DISHES: Partial<Dish>[] = [
    {
        name: "Classic Wagyu Burger",
        description: "Premium wagyu beef, aged cheddar, caramelized onions, and truffle aioli on a toasted brioche bun.",
        price: 24.50,
        category: "Main",
        images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop"],
        isARReady: true,
        arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb", // Using Astro as placeholder
        modelGenerationStatus: "ready",
        generationProgress: 100
    },
    {
        name: "Truffle Mushroom Risotto",
        description: "Creamy arborio rice with wild forest mushrooms, fresh herbs, and shavings of black winter truffle.",
        price: 19.00,
        category: "Main",
        images: ["https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=1000&auto=format&fit=crop"],
        isARReady: true,
        arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        modelGenerationStatus: "ready",
        generationProgress: 100
    },
    {
        name: "Matcha Lava Cake",
        description: "Warm ceremonial grade matcha cake with a molten white chocolate center, served with black sesame ice cream.",
        price: 14.00,
        category: "Dessert",
        images: ["https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop"],
        isARReady: true,
        arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        modelGenerationStatus: "ready",
        generationProgress: 100
    }
];

export const seedDemoData = async () => {
    console.log("Seeding demo data...");
    try {
        // Check if demo user has dishes
        const existing = await db.queryDishes(DEMO_USER_ID);
        if (existing.length > 0) {
            console.log("Demo data already exists. Skipping.");
            return;
        }

        // Create demo user config if not exists
        const config = await db.getConfig(DEMO_USER_ID);
        if (!config) {
            await db.saveConfig({
                userId: DEMO_USER_ID,
                restaurant_name: "Gourmet Garden",
                tables_count: 8
            } as any);
        }

        // Seed dishes
        for (const dish of DEMO_DISHES) {
            await db.insertDish({
                ...dish,
                id: `demo_${Math.random().toString(36).substr(2, 9)}`,
                userId: DEMO_USER_ID
            } as Dish);
        }

        console.log("Demo data seeded successfully.");
    } catch (error) {
        console.error("Error seeding demo data:", error);
    }
};
