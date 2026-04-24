import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bus,
  Car,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react'

function App() {
  const routes = [
    'All routes',
    'UIUC → ORD',
    'ORD → UIUC',
    'UIUC → Midway',
    'UIUC → Downtown Chicago',
  ]

  const [selectedRoute, setSelectedRoute] = useState('All routes')
  const [searchTerm, setSearchTerm] = useState('')

  const driverListings = [
    {
      id: 1,
      name: 'Aarav S.',
      route: 'UIUC → ORD',
      seats: 3,
      departure: 'Fri, 4:30 PM',
      vehicle: 'Toyota Camry',
      note: 'Usually leaves from Green Street near Illini Union.',
    },
    {
      id: 2,
      name: 'Maya L.',
      route: 'ORD → UIUC',
      seats: 2,
      departure: 'Sun, 7:00 PM',
      vehicle: 'Honda CR-V',
      note: 'Returning after weekend flight arrivals.',
    },
    {
      id: 3,
      name: 'Daniel K.',
      route: 'UIUC → Midway',
      seats: 1,
      departure: 'Sat, 9:15 AM',
      vehicle: 'Nissan Altima',
      note: 'Can share luggage space for one checked bag.',
    },
    {
      id: 4,
      name: 'Priya R.',
      route: 'UIUC → Downtown Chicago',
      seats: 2,
      departure: 'Fri, 5:45 PM',
      vehicle: 'Mazda CX-5',
      note: 'Drop-off near Union Station and West Loop.',
    },
  ]

  const riderRequests = [
    {
      id: 1,
      route: 'UIUC → ORD',
      rider: 'Graduate student',
      timing: 'This Friday before 6 PM',
      details: 'One rider + one carry-on. Flexible pickup near campus.',
    },
    {
      id: 2,
      route: 'ORD → UIUC',
      rider: 'Undergrad student',
      timing: 'Sunday evening',
      details: 'Lands at 5:40 PM, looking for shared ride to Champaign.',
    },
    {
      id: 3,
      route: 'UIUC → Downtown Chicago',
      rider: 'Visiting scholar',
      timing: 'Next Wednesday morning',
      details: 'Needs drop-off near River North, light luggage only.',
    },
  ]

  const filteredDrivers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return driverListings.filter((driver) => {
      const routeMatch =
        selectedRoute === 'All routes' || driver.route === selectedRoute

      const keywordMatch =
        keyword.length === 0 ||
        [driver.name, driver.route, driver.vehicle, driver.note]
          .join(' ')
          .toLowerCase()
          .includes(keyword)

      return routeMatch && keywordMatch
    })
  }, [driverListings, searchTerm, selectedRoute])

  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
    viewport: { once: true, amount: 0.15 },
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl sm:p-12"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Bus size={16} />
            UIUC Intercity Ride Board
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Find student-friendly rides between UIUC and Chicago-area stops.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-100 sm:text-lg">
            A simple listing and request platform to help UIUC students connect
            with drivers, share routes, and coordinate travel plans.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#search"
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Browse Listings
            </a>
            <a
              href="#requests"
              className="rounded-xl border border-white/40 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Post a Request
            </a>
          </div>
        </motion.div>
      </section>

      <section id="search" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          {...cardMotion}
        >
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <Search size={18} />
            <h2 className="text-xl font-semibold">Route Search</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Route focus
              </span>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
              >
                {routes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Keyword
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by driver name, route, vehicle, or notes"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Driver Listings</h2>
          <span className="text-sm text-slate-500">
            {filteredDrivers.length} result{filteredDrivers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDrivers.map((driver) => (
            <motion.article
              key={driver.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              {...cardMotion}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{driver.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin size={15} /> {driver.route}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {driver.seats} seat{driver.seats === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <Clock3 size={15} /> Departure: {driver.departure}
                </p>
                <p className="flex items-center gap-2">
                  <Car size={15} /> Vehicle: {driver.vehicle}
                </p>
                <p>{driver.note}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                  Contact
                </button>
                <button className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  View Details
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        {filteredDrivers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            No listings matched your search. Try a different route or keyword.
          </div>
        ) : null}
      </section>

      <section id="requests" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">Ride Requests</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {riderRequests.map((request) => (
            <motion.article
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              {...cardMotion}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {request.route}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{request.rider}</h3>
              <p className="mt-1 text-sm text-slate-600">{request.timing}</p>
              <p className="mt-3 text-sm text-slate-700">{request.details}</p>
              <button className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                Offer Ride
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          {...cardMotion}
        >
          <h2 className="text-2xl font-semibold text-slate-900">Driver Application</h2>
          <p className="mt-2 text-sm text-slate-600">
            Interested in posting rides? Submit your basic info below. This MVP
            form is a placeholder for future backend integration.
          </p>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">UIUC email</span>
              <input
                type="email"
                placeholder="netid@illinois.edu"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Primary route</span>
              <select className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring">
                {routes.slice(1).map((route) => (
                  <option key={route}>{route}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Available seats</span>
              <input
                type="number"
                min="1"
                max="6"
                placeholder="2"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                rows="4"
                placeholder="Share your typical departure times, pickup area, and any rider expectations"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Submit Application
              </button>
            </div>
          </form>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.article
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          {...cardMotion}
        >
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <ShieldCheck size={18} />
            <h2 className="text-xl font-semibold">Trust & Safety</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Encourage riders and drivers to verify UIUC email addresses.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Meet at public pickup points and share itinerary with friends.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Use in-app messaging (future phase) before sharing personal details.
            </li>
          </ul>
        </motion.article>

        <motion.article
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          {...cardMotion}
        >
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <Phone size={18} />
            <h2 className="text-xl font-semibold">Contact & Support</h2>
          </div>
          <p className="text-sm text-slate-700">
            Questions, feedback, or reporting issues? Reach out and we’ll follow
            up as this MVP evolves.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <Mail size={15} /> support@uiucrideboard.com
            </p>
            <p className="flex items-center gap-2">
              <User size={15} /> Built for UIUC intercity ride coordination
            </p>
          </div>
          <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
            <textarea
              rows="3"
              placeholder="How can we help?"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Send Message
            </button>
          </form>
        </motion.article>
      </section>
    </main>
  )
}

export default App
