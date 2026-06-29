export type Project = {
    id: string;
    name: string;
    description: string;
    url: string;
    /** Video for desktop & tablet. */
    desktopShowcase: string;
    /** Video for mobile devices. */
    mobileShowcase: string;
    /** Fallback image for desktop & tablet — shown while the video loads or if it fails. */
    desktopFallback: string;
    /** Fallback image for mobile devices. */
    mobileFallback: string;
};

export const projects: Project[] = [
    {
        id: "woke",
        name: "woke",
        description:
            "Premium fashion e-commerce experience built with a fully custom Shopify theme. Advanced animations, optimized storefront performance, and modern UX designed to elevate online shopping.",
        url: "https://woke-eg.com",
        desktopShowcase: "/woke-desktop-showcase.mp4",
        mobileShowcase: "/woke-mobile-showcase.mp4",
        desktopFallback: "/woke-desktop-fallback.png",
        mobileFallback: "/woke-mobile-fallback.png",
    },
    {
        id: "project-may",
        name: "project may",
        description:
            "Project May is a specialized web application designed to automatically generate standard 10-section Safety Data Sheets (SDS) for chemical compounds.",
        url: "https://project-may-chem.vercel.app",
        desktopShowcase: "/prjktmay-desktop-showcase.mp4",
        mobileShowcase: "/prjktmay-mobile-showcase.mp4",
        desktopFallback: "/prjktmay-desktop-placeholder.png",
        mobileFallback: "/prjktmay-mobile-fallback.png",
    },
    {
        id: "salty",
        name: "salty",
        description:
            "Premium fashion e-commerce platform built with Shopify Hydrogen and React Router v7. Advanced animations, smart bundling system, and modern UX for a cutting-edge shopping experience.",
        url: "https://saltyeg.com",
        desktopShowcase: "/salty-desktop-showcase.mp4",
        mobileShowcase: "/salty-mobile-showcase.mp4",
        desktopFallback: "/salty-desktop-fallback.png",
        mobileFallback: "/salty-mobile-fallback.png",
    },
    {
        id: "ankh",
        name: "ankh",
        description:
            "Ankh is an elegant productivity application that combines task management, note-taking, and time tracking functionalities in one seamless interface.",
        url: "https://ankhbytalyawy.vercel.app",
        desktopShowcase: "/ankh-desktop-showcase.mp4",
        mobileShowcase: "/ankh-mobile-showcase.mp4",
        desktopFallback: "/ankh-desktop-placecholder.png",
        mobileFallback: "/ankh-mobile-fallback.png",
    },
];
