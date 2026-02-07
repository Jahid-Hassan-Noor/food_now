import { Button } from "@/components/ui/button"

export function ChefPromo() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 sm:p-4 text-center my-2 sm:my-4 mx-2">
      <h3 className="mb-1 sm:mb-1.5 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
        Share Your Culinary Passion
      </h3>
      <p className="mb-2 sm:mb-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
        Join our community of chefs and start sharing your delicious recipes in AIU!
      </p>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold h-8 sm:h-9 text-xs sm:text-sm"
      >
        Become a Chef Now
      </Button>
    </div>
  )
}
