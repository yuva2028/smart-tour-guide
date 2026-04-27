export const VOICE_LANGUAGES = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
]

export const CHAT_PROMPTS = [
  'What should I visit next?',
  'Give me a 2-hour plan nearby.',
  'Where can I eat after this monument?',
  'Tell me a fun historical fact.',
  'Show me hidden gems nearby.',
  'How should I budget this trip?',
]

const SITE_DETAILS = {
  'taj-mahal': {
    entryFee: 'Ticket prices vary. Check the official booking page before visiting.',
    hours: 'Usually sunrise to sunset. Verify before planning your route.',
    bookingUrl: 'https://asi.payumoney.com/',
    restorationStory:
      'The monument is under continuous conservation for marble care, inlay restoration, and riverbank impact management.',
    duration: '2 to 3 hours',
    neighborhood: 'Yamuna riverside heritage district',
    signatureView: 'Best glow at sunrise with a long-axis garden view.',
    estimatedSpend: 'High-value signature stop',
    bestFor: ['Photography', 'History', 'Architecture'],
    photoMoments: ['Sunrise marble glow', 'Reflecting pool symmetry', 'Riverside silhouette'],
    timeline: [
      { year: '1632', label: 'Commissioned', note: 'Construction began under Shah Jahan.' },
      { year: '1648', label: 'Main complex completed', note: 'The mausoleum core was substantially finished.' },
      { year: '1900s', label: 'Repair campaigns', note: 'Gardens and some finishes were reworked during preservation phases.' },
      { year: 'Today', label: 'Protected icon', note: 'The site is one of the world\'s most recognized heritage landmarks.' },
    ],
  },
  'india-gate': {
    entryFee: 'Open public landmark. Verify access advisories before visiting.',
    hours: 'Typically open public access throughout the day.',
    bookingUrl: 'https://www.google.com/search?q=India+Gate+visitor+information',
    restorationStory:
      'Lighting, landscaping, and memorial interpretation continue to evolve around the ceremonial axis.',
    duration: '45 to 90 minutes',
    neighborhood: 'Central vista and civic promenade',
    signatureView: 'Blue-hour skyline framing with evening lights.',
    estimatedSpend: 'Low-cost public stop',
    bestFor: ['Evening strolls', 'Civic history', 'Photography'],
    photoMoments: ['Ceremonial axis', 'Night lighting', 'Wide plaza energy'],
    timeline: [
      { year: '1921', label: 'Foundation laid', note: 'Designed by Edwin Lutyens as a memorial arch.' },
      { year: '1931', label: 'Opened', note: 'The structure became a major civic landmark.' },
      { year: '1972', label: 'Amar Jawan Jyoti', note: 'A national memorial layer was added after the 1971 war.' },
      { year: 'Today', label: 'Public gathering space', note: 'The site remains central to tourism and public memory.' },
    ],
  },
  'qutub-minar': {
    entryFee: 'Ticket prices vary by category. Check the official monument listing before visiting.',
    hours: 'Typically daytime entry. Confirm current hours before arrival.',
    bookingUrl: 'https://www.google.com/search?q=Qutub+Minar+official+tickets',
    restorationStory:
      'Stone conservation, inscription care, and structural monitoring are key parts of ongoing preservation.',
    duration: '1.5 to 2 hours',
    neighborhood: 'Mehrauli archaeological zone',
    signatureView: 'Look for warm sandstone detail in angled afternoon light.',
    estimatedSpend: 'Balanced heritage stop',
    bestFor: ['History', 'Architecture', 'Archaeology'],
    photoMoments: ['Tower base upward shot', 'Carved inscription closeups', 'Complex ruins panorama'],
    timeline: [
      { year: '1190s', label: 'Foundation era', note: 'The tower began as part of an early Delhi Sultanate complex.' },
      { year: '1200s', label: 'Successive additions', note: 'Later rulers expanded and repaired the structure.' },
      { year: '1800s', label: 'Colonial conservation', note: 'Interventions helped stabilize the monument for future preservation.' },
      { year: 'Today', label: 'UNESCO heritage site', note: 'The complex remains a major reference point for Indo-Islamic architecture.' },
    ],
  },
  'gateway-of-india': {
    entryFee: 'Open public plaza. Ferry or add-on experiences may cost extra.',
    hours: 'The plaza is typically accessible throughout the day.',
    bookingUrl: 'https://www.google.com/search?q=Gateway+of+India+visitor+information',
    restorationStory:
      'Conservation efforts focus on the stone arch, waterfront edges, and visitor circulation in the harbor zone.',
    duration: '45 to 75 minutes',
    neighborhood: 'Apollo Bunder waterfront',
    signatureView: 'Harbor-facing wide shot with boats and skyline movement.',
    estimatedSpend: 'Flexible public stop',
    bestFor: ['Waterfront walks', 'Photography', 'City orientation'],
    photoMoments: ['Harbor backdrop', 'Plaza energy', 'Boat and arch composition'],
    timeline: [
      { year: '1911', label: 'Imperial visit marker', note: 'The site traces back to the royal visit context that inspired the monument.' },
      { year: '1924', label: 'Completed', note: 'The basalt arch became a defining city landmark.' },
      { year: '1948', label: 'Historic departure point', note: 'The site gained layered symbolism in post-colonial memory.' },
      { year: 'Today', label: 'Waterfront icon', note: 'It remains one of Mumbai\'s most recognizable public monuments.' },
    ],
  },
  'red-fort': {
    entryFee: 'Ticket prices vary. Confirm the official listing before scheduling entry.',
    hours: 'Usually daytime opening with restricted entry after hours.',
    bookingUrl: 'https://www.google.com/search?q=Red+Fort+official+tickets',
    restorationStory:
      'The fort complex sees ongoing masonry, landscape, and museum interpretation work.',
    duration: '2 to 3 hours',
    neighborhood: 'Old Delhi heritage corridor',
    signatureView: 'Massive ramparts and ceremonial courts are strongest in morning light.',
    estimatedSpend: 'Balanced to premium heritage stop',
    bestFor: ['History', 'Large-site exploration', 'Architecture'],
    photoMoments: ['Red sandstone walls', 'Ceremonial gateways', 'Interior court geometry'],
    timeline: [
      { year: '1639', label: 'Imperial foundation', note: 'Construction began as the Mughal court shifted to Shahjahanabad.' },
      { year: '1648', label: 'Court life established', note: 'The complex became the heart of imperial ceremony.' },
      { year: '1857', label: 'Turning point', note: 'Conflict and political change transformed the site\'s role.' },
      { year: 'Today', label: 'National symbol', note: 'The fort anchors annual Independence Day ceremonies.' },
    ],
  },
  charminar: {
    entryFee: 'Entry policies may vary. Check the latest visitor notice before going.',
    hours: 'Typically daytime to evening visits depending on local access rules.',
    bookingUrl: 'https://www.google.com/search?q=Charminar+visitor+information',
    restorationStory:
      'Stone cleaning, structural care, and traffic-sensitive preservation remain ongoing priorities.',
    duration: '1 to 1.5 hours',
    neighborhood: 'Old City bazaar district',
    signatureView: 'Best atmosphere comes from bazaar energy and lantern-lit evening scenes.',
    estimatedSpend: 'Budget-friendly cultural stop',
    bestFor: ['Street culture', 'Photography', 'Food walks'],
    photoMoments: ['Bazaar framing', 'Lantern glow', 'Four-minaret symmetry'],
    timeline: [
      { year: '1591', label: 'Built', note: 'The monument became a defining symbol of Hyderabad\'s historic core.' },
      { year: '1600s', label: 'Urban anchor', note: 'The area developed into a dense commercial and cultural center.' },
      { year: '1900s', label: 'Conservation attention', note: 'Modern preservation efforts responded to pollution and traffic pressure.' },
      { year: 'Today', label: 'Living landmark', note: 'The site remains both a monument and an active city-space marker.' },
    ],
  },
}

const SEED_REVIEWS = {
  'taj-mahal': [
    {
      id: 'seed-taj-1',
      author: 'Community note',
      rating: 5,
      text: 'Sunrise was the smoothest time for photos and lighter crowd pressure.',
      createdAt: 'Demo review',
    },
    {
      id: 'seed-taj-2',
      author: 'Community note',
      rating: 4,
      text: 'Allocate enough time for security lines and the garden axis walk.',
      createdAt: 'Demo review',
    },
  ],
  'india-gate': [
    {
      id: 'seed-india-gate-1',
      author: 'Community note',
      rating: 4,
      text: 'A great evening stop when you want a public landmark without ticketing friction.',
      createdAt: 'Demo review',
    },
  ],
  'qutub-minar': [
    {
      id: 'seed-qutub-1',
      author: 'Community note',
      rating: 5,
      text: 'The carved details become more interesting the closer you study the inscriptions and fluting.',
      createdAt: 'Demo review',
    },
  ],
  'gateway-of-india': [
    {
      id: 'seed-gateway-1',
      author: 'Community note',
      rating: 4,
      text: 'Pair this stop with a waterfront snack and a ferry glance for the full atmosphere.',
      createdAt: 'Demo review',
    },
  ],
  'red-fort': [
    {
      id: 'seed-red-fort-1',
      author: 'Community note',
      rating: 4,
      text: 'This is a larger site, so comfortable shoes make a big difference.',
      createdAt: 'Demo review',
    },
  ],
  charminar: [
    {
      id: 'seed-charminar-1',
      author: 'Community note',
      rating: 5,
      text: 'The surrounding food walk and bazaar energy add as much to the experience as the monument itself.',
      createdAt: 'Demo review',
    },
  ],
}

function buildGenericTimeline(place) {
  const category = place?.category || 'heritage site'

  return [
    {
      year: 'Origin',
      label: 'Founding era',
      note: `${place?.name || 'This site'} emerged as a notable ${category.toLowerCase()}.`,
    },
    {
      year: 'Peak',
      label: 'Golden period',
      note: 'The site gained its strongest cultural or political significance during this phase.',
    },
    {
      year: 'Change',
      label: 'Damage and adaptation',
      note: 'Weather, conflict, or urban change altered parts of the original structure over time.',
    },
    {
      year: 'Today',
      label: 'Conservation',
      note: 'Modern visitors experience the monument through preservation and interpretation.',
    },
  ]
}

function buildDefaultSiteDetails(place) {
  return {
    entryFee: 'Check the official listing before visiting.',
    hours: 'Check before visiting.',
    bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(
      `${place?.name || 'tourist site'} official tickets`,
    )}`,
    restorationStory:
      'Detailed restoration records are not preloaded for this site, but the guide can still help with nearby context, timing, and route planning.',
    duration: '1 to 2 hours',
    neighborhood: place?.city || 'Nearby heritage district',
    signatureView: 'Look for a wide establishing shot and one close architectural detail.',
    estimatedSpend: 'Flexible stop',
    bestFor: ['Exploration', 'Photography'],
    photoMoments: ['Entry view', 'Architectural detail'],
    timeline: buildGenericTimeline(place),
  }
}

export function getSiteDetails(place) {
  if (!place) {
    return buildDefaultSiteDetails(place)
  }

  return SITE_DETAILS[place.id] || buildDefaultSiteDetails(place)
}

export function getSeedReviews(placeId) {
  if (!placeId) {
    return []
  }

  return SEED_REVIEWS[placeId] || []
}

export function getCrowdInsight(place, date = new Date()) {
  const hour = date.getHours()
  const weekend = date.getDay() === 0 || date.getDay() === 6
  const likelyBusy = weekend || (hour >= 11 && hour <= 16)
  const month = date.getMonth()
  const weatherSignal =
    month >= 3 && month <= 5
      ? 'Carry water and prioritize shaded segments during midday.'
      : month >= 6 && month <= 8
        ? 'Plan for rain-ready movement and flexible transport options.'
        : 'Conditions are generally better for longer walking loops.'

  return {
    level: likelyBusy ? 'Busy' : hour <= 9 || hour >= 17 ? 'Calm' : 'Moderate',
    bestWindow: weekend ? 'Before 9:00 AM or after 5:30 PM' : '8:00 AM to 10:30 AM',
    photoWindow: hour >= 16 ? 'Golden hour is active now' : 'Try golden hour near sunset',
    tip: place
      ? `${place.name} is usually easier to explore when you arrive early and finish before the midday peak.`
      : 'Early morning is usually the safest default for lighter crowds and cooler weather.',
    weatherSignal,
  }
}

function formatDuration(distanceKm, pace = 'balanced') {
  const multiplier = pace === 'fast' ? 10 : pace === 'deep' ? 18 : 14
  const minutes = Math.max(8, Math.round(distanceKm * multiplier))
  return `about ${minutes} minutes`
}

export function buildItinerary({
  selectedPlace,
  nearbyPlaces,
  foodOptions,
  transportOptions,
  pace,
}) {
  const attractions = nearbyPlaces
    .filter((place) => place.id !== selectedPlace?.id)
    .slice(0, pace === 'fast' ? 2 : pace === 'deep' ? 4 : 3)
  const mealStop = foodOptions[0]
  const transfer = transportOptions[0]

  return [
    {
      title: 'Start with the main highlight',
      detail: selectedPlace
        ? `Begin at ${selectedPlace.name} with the live camera, voice guide, and orientation card.`
        : 'Begin with the closest highlighted attraction and calibrate location plus camera.',
    },
    ...attractions.map((place, index) => ({
      title: `Stop ${index + 1}: ${place.name}`,
      detail: `Move ${place.distanceKm < 1 ? 'a short distance' : formatDuration(place.distanceKm, pace)} and explore its surrounding context on foot.`,
    })),
    mealStop
      ? {
          title: 'Food break',
          detail: `Pause at ${mealStop.name} for ${mealStop.cuisine || 'a local meal'}.`,
        }
      : null,
    transfer
      ? {
          title: 'Move to the next zone',
          detail: `Use ${transfer.name} (${transfer.type || 'transit'}) if you want to extend the tour to another cluster.`,
        }
      : null,
  ].filter(Boolean)
}

function getBudgetProfile(budgetTier = 'balanced') {
  const profiles = {
    budget: { baseDay: 1800, ticket: 200, meal: 450, transit: 240, buffer: 300, label: 'Budget-smart' },
    balanced: { baseDay: 3200, ticket: 350, meal: 850, transit: 420, buffer: 600, label: 'Balanced explorer' },
    premium: { baseDay: 6200, ticket: 700, meal: 1800, transit: 950, buffer: 1200, label: 'Premium comfort' },
  }

  return profiles[budgetTier] || profiles.balanced
}

export function buildBudgetPlan({
  selectedPlace,
  foodOptions,
  transportOptions,
  tripDays = 2,
  budgetTier = 'balanced',
}) {
  const profile = getBudgetProfile(budgetTier)
  const placeBias = selectedPlace?.id === 'taj-mahal' ? 1.18 : selectedPlace?.id === 'red-fort' ? 1.08 : 1
  const foodBias = foodOptions.length > 0 ? 1.04 : 0.92
  const transitBias = transportOptions.length > 0 ? 1 : 0.88

  const ticketCost = Math.round(profile.ticket * placeBias * tripDays)
  const foodCost = Math.round(profile.meal * foodBias * tripDays)
  const transportCost = Math.round(profile.transit * transitBias * tripDays)
  const stayAndExtras = Math.round(profile.baseDay * tripDays)
  const buffer = Math.round(profile.buffer * tripDays)
  const total = ticketCost + foodCost + transportCost + stayAndExtras + buffer
  const dailyAverage = Math.round(total / Math.max(1, tripDays))

  return {
    label: profile.label,
    total,
    dailyAverage,
    ticketCost,
    foodCost,
    transportCost,
    stayAndExtras,
    buffer,
    tip:
      budgetTier === 'budget'
        ? 'Cluster nearby attractions on foot and keep one paid highlight per day.'
        : budgetTier === 'premium'
          ? 'Reserve buffer for guided access, priority mobility, and sunset dining.'
          : 'Mix one marquee site with one lighter public stop to balance spend and energy.',
  }
}

export function buildDayPlans({
  selectedPlace,
  nearbyPlaces,
  foodOptions,
  transportOptions,
  tripDays = 2,
  budgetTier = 'balanced',
  travelStyle = 'culture',
}) {
  const days = Math.max(1, Math.min(5, tripDays))
  const anchorPlaces = [
    selectedPlace,
    ...nearbyPlaces.filter((place) => place.id !== selectedPlace?.id),
  ].filter(Boolean)

  return Array.from({ length: days }, (_, index) => {
    const morning = anchorPlaces[index] || anchorPlaces[0]
    const afternoon = anchorPlaces[index + 1] || anchorPlaces[0]
    const mealStop = foodOptions[index % Math.max(foodOptions.length, 1)] || null
    const transfer = transportOptions[index % Math.max(transportOptions.length, 1)] || null

    return {
      dayNumber: index + 1,
      title:
        index === 0
          ? `${morning?.name || 'Arrival'} spotlight day`
          : `${travelStyle[0]?.toUpperCase() || 'T'}${travelStyle.slice(1)} route day ${index + 1}`,
      focus:
        travelStyle === 'food'
          ? 'Blend landmark time with strong local food stops.'
          : travelStyle === 'photo'
            ? 'Prioritize light, viewpoints, and scene transitions.'
            : travelStyle === 'relaxed'
              ? 'Keep walking distances soft and leave recovery time between stops.'
              : 'Balance heritage depth with easy movement.',
      spend:
        budgetTier === 'budget'
          ? 'Lean budget'
          : budgetTier === 'premium'
            ? 'Comfort-heavy'
            : 'Balanced budget',
      summary: morning
        ? `Begin with ${morning.name}, transition toward ${afternoon?.name || 'a nearby stop'}, and close with a low-friction evening window.`
        : 'Start with the nearest attraction and keep the second half of the day flexible.',
      stops: [
        morning ? `Morning: ${morning.name}` : 'Morning: Arrival orientation',
        afternoon ? `Afternoon: ${afternoon.name}` : 'Afternoon: Free exploration',
        mealStop ? `Meal: ${mealStop.name}` : 'Meal: Local break near your route',
        transfer ? `Mobility: ${transfer.name}` : 'Mobility: Walk or short-hop transit',
      ],
    }
  })
}

export function buildProfileBadges({
  favoritesCount = 0,
  visitedCount = 0,
  reviewCount = 0,
  savedTripsCount = 0,
  profileReady = false,
}) {
  return [
    {
      title: 'Passport Ready',
      detail: 'Create a traveler identity and keep your trip data with you.',
      unlocked: profileReady,
    },
    {
      title: 'Collector',
      detail: 'Save at least two favorite places for later.',
      unlocked: favoritesCount >= 2,
    },
    {
      title: 'Field Explorer',
      detail: 'Mark three places as visited.',
      unlocked: visitedCount >= 3,
    },
    {
      title: 'Guide Contributor',
      detail: 'Leave two reviews for future travelers.',
      unlocked: reviewCount >= 2,
    },
    {
      title: 'Offline Ready',
      detail: 'Save one trip pack for low-network travel.',
      unlocked: savedTripsCount >= 1,
    },
  ]
}

export function buildLocalizedGuide(place, area, locale) {
  if (!place) {
    return ''
  }

  const scripts = {
    'en-IN': `${place.name} is ahead near ${place.city || area || 'your location'}. ${place.summary} ${place.funFact}`,
    'hi-IN': `${place.name} aapke saamne hai. Yeh sthaan ${place.city || area || 'aapke aas-paas'} ke paas hai. ${place.summary} ${place.funFact}`,
    'fr-FR': `${place.name} se trouve devant vous, pres de ${place.city || area || 'votre position'}. ${place.summary} ${place.funFact}`,
    'es-ES': `${place.name} esta frente a ti, cerca de ${place.city || area || 'tu ubicacion'}. ${place.summary} ${place.funFact}`,
  }

  return scripts[locale] || scripts['en-IN']
}

export function buildSafetyBrief(locationLabel, safetyOptions) {
  const essentials = safetyOptions.slice(0, 3).map((item) => item.name)

  return {
    title: `Safety layer for ${locationLabel}`,
    contacts: ['112 emergency', 'Tourist police', 'Nearest hospital'],
    tips: [
      'Keep battery saver off while navigating with GPS and camera.',
      'Prefer well-lit, crowded routes after sunset.',
      'Carry water and check site-specific restrictions before entry.',
    ],
    nearby: essentials,
  }
}

export function buildFallbackChatReply({
  question,
  selectedPlace,
  foodOptions,
  transportOptions,
  itinerary,
  budgetPlan,
  dayPlans,
  favoritePlaces,
  recommendations,
}) {
  const lowered = question.toLowerCase()

  if (lowered.includes('budget') || lowered.includes('cost') || lowered.includes('cheap')) {
    return budgetPlan
      ? `A ${budgetPlan.label.toLowerCase()} route would be around INR ${budgetPlan.dailyAverage} per day. ${budgetPlan.tip}`
      : 'Try keeping one paid site per day and clustering nearby stops on foot.'
  }

  if (lowered.includes('hidden') || lowered.includes('gem')) {
    const suggestion = recommendations?.[0]
    return suggestion
      ? `${suggestion.title}: ${suggestion.detail}`
      : 'Try widening the live scan radius and look for quieter stops just outside the main cluster.'
  }

  if (lowered.includes('eat') || lowered.includes('restaurant') || lowered.includes('food')) {
    const food = foodOptions[0]
    return food
      ? `Try ${food.name}. It is nearby, fits a traveler stop, and is tagged for ${food.cuisine}.`
      : 'I could not find a nearby restaurant suggestion yet. Try refreshing live data or widening the radius.'
  }

  if (
    lowered.includes('next') ||
    lowered.includes('plan') ||
    lowered.includes('itinerary') ||
    lowered.includes('day')
  ) {
    const next = itinerary?.[1]
    const day = dayPlans?.[0]
    if (next) {
      return `Next I would suggest: ${next.title}. ${next.detail}${day ? ` Day 1 focus: ${day.summary}` : ''}`
    }

    return 'Start with the selected monument and then scan the nearby list for the closest attraction.'
  }

  if (lowered.includes('transport') || lowered.includes('bus') || lowered.includes('metro')) {
    const option = transportOptions[0]
    return option
      ? `${option.name} is the nearest strong transport option right now. It is a ${option.type.toLowerCase()} access point.`
      : 'Transport links are still loading or unavailable for this area.'
  }

  if (lowered.includes('favorite') || lowered.includes('saved')) {
    return favoritePlaces?.length
      ? `You have ${favoritePlaces.length} saved places. The top saved highlight is ${favoritePlaces[0].name}.`
      : 'You have not saved any favorites yet. Add one from the nearby places list to keep it handy.'
  }

  if (selectedPlace) {
    return `${selectedPlace.name}: ${selectedPlace.summary} ${selectedPlace.funFact}`
  }

  return 'Ask me about nearby places, budget, food, transport, hidden gems, or how to spend the next few hours around you.'
}
