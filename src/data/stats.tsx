import { BsBarChartFill, BsFillStarFill } from "react-icons/bs";
import { PiGlobeFill } from "react-icons/pi";

import { IStats } from "@/types";

export const stats: IStats[] = [
    {
        title: "500K+",
        icon: <BsBarChartFill size={34} className="text-secondary" />,
        description: "Recipes generated every month by home cooks like you."
    },
    {
        title: "4.9",
        icon: <BsFillStarFill size={34} className="text-yellow-500" />,
        description: "Average rating from users who love cooking with AI suggestions."
    },
    {
        title: "50+",
        icon: <PiGlobeFill size={34} className="text-green-600" />,
        description: "Cuisines and dietary styles supported for every taste."
    }
];
