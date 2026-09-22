import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Users,
  Sparkles,
  KanbanSquare,
  Bell,
  Download,
  Link2,
  CheckCircle2,
  Smartphone,
  Table2,
} from 'lucide-react';

const features = [
  {
    icon: KanbanSquare,
    title: 'Tasks on a Kanban board',
    body: 'Move tasks from To Do to In Progress to Done. Add priorities, due dates and your own categories.',
    color: 'bg-flow-lavender',
  },
  {
    icon: Users,
    title: 'Shared calendars',
    body: 'Make a calendar for roommates, a study group or your team. Share one link and everyone can add tasks and events.',
    color: 'bg-flow-green',
  },
  {
    icon: Sparkles,
    title: 'Find your free time',
    body: 'Flow State checks your week and lists every open slot. On a shared calendar, it finds times when everyone is free.',
    color: 'bg-flow-yellow',
  },
  {
    icon: Download,
    title: 'Works with Apple Calendar',
    body: 'Export your events and task deadlines to Apple Calendar, so they show up with the rest of your schedule.',
    color: 'bg-flow-pink/60',
  },
  {
    icon: Bell,
    title: 'Reminders that reach you',
    body: 'Set reminders on tasks and get notified in the app and by email before things are due.',
    color: 'bg-flow-lavender',
  },
  {
    icon: Table2,
    title: 'Trackers',
    body: 'Build simple spreadsheet-style trackers for habits, budgets or anything else, and export them to Excel.',
    color: 'bg-flow-green',
  },
];

const steps = [
  { n: '1', title: 'Create a calendar', body: 'Name it “Apartment 4B” or “Bio 201 Study Group” and pick a color.' },
  { n: '2', title: 'Share the link', body: 'Send it by text, email or group chat. People join with their Flow State account.' },
  { n: '3', title: 'Plan together', body: 'Everyone adds events and shared to-dos, checks things off and sees when the group is free.' },
];

/** Static product preview for the hero. Built in HTML so it stays sharp at any size. */
const HeroMockup: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // [dayIndex, startRow, rowSpan, label, color] on a 9am–5pm grid (8 rows)
  const blocks: [number, number, number, string, string][] = [
    [0, 0, 2, 'Bio lecture', '#8894d1'],
    [1, 3, 1, 'Gym', '#dfa4c6'],
    [2, 1, 2, 'Group project', '#7cc47f'],
    [3, 0, 1, 'Standup', '#8894d1'],
    [3, 5, 2, 'Shift', '#f0b35e'],
    [4, 2, 1, '○ Clean kitchen', '#7cc47f'],
  ];
  const free: [number, number, number][] = [
    [0, 4, 3], [1, 0, 2], [2, 5, 3], [4, 4, 4],
  ];
  return (
    <div className="relative w-full max-w-lg mx-auto" aria-hidden>
      <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 rotate-1">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading text-xl text-gray-900">This week</div>
          <div className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-2.5 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" /> Free time
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] font-semibold text-gray-500 mb-1.5">
          {days.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-5 gap-1.5" style={{ gridTemplateRows: 'repeat(8, 22px)' }}>
          {free.map(([d, r, span], i) => (
            <div
              key={`f${i}`}
              className="rounded-md bg-green-100 border border-green-300 border-dashed"
              style={{ gridColumn: d + 1, gridRow: `${r + 1} / span ${span}` }}
            />
          ))}
          {blocks.map(([d, r, span, label, color], i) => (
            <div
              key={i}
              className="rounded-md text-[10px] leading-tight text-white font-medium px-1.5 py-1 overflow-hidden"
              style={{ gridColumn: d + 1, gridRow: `${r + 1} / span ${span}`, backgroundColor: color }}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-flow-green/60 px-3 py-2 text-xs text-gray-800">
          <strong>12h</strong> free this week across 4 slots
        </div>
      </div>

      {/* Floating shared-calendar chip */}
      <div className="absolute -left-3 sm:-left-8 -bottom-14 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 -rotate-2">
        <div className="flex -space-x-2">
          {['A', 'J', 'M'].map((l, i) => (
            <div key={l} className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-heading"
              style={{ backgroundColor: ['#8894d1', '#dfa4c6', '#7cc47f'][i] }}>
              {l}
            </div>
          ))}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Roommates</div>
          <div className="text-xs text-gray-500">Everyone’s free Thu 1–4pm</div>
        </div>
      </div>

      {/* Floating task card */}
      <div className="hidden sm:block absolute -right-6 -top-6 bg-white rounded-2xl shadow-xl px-4 py-3 rotate-3 w-48">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">In progress</div>
        <div className="text-sm font-medium text-gray-900">Finish lab report</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">High</span>
          <span className="text-[10px] text-gray-500">Due Fri</span>
        </div>
      </div>
    </div>
  );
};

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-flow-yellow text-gray-800 font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-flow-purple/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/Logo.png" alt="" className="h-10 w-10 object-contain" />
            <span className="font-heading text-2xl sm:text-3xl text-flow-green">Flow State</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#shared" className="hover:text-white">Shared calendars</a>
            <a href="#free-time" className="hover:text-white">Free time</a>
            <a href="#mobile" className="hover:text-white">Mobile</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg">Log in</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-flow-green text-gray-900 rounded-lg hover:bg-white">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-flow-purple overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 pt-12 pb-28 sm:pt-16 sm:pb-32 grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm text-white bg-white/15 rounded-full px-3 py-1 mb-5">
                <CalendarDays className="h-4 w-4" /> Tasks · Shared calendars · Free time
              </p>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-flow-green leading-[1.05] mb-5">
                Get into your<br />flow state.
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 mb-8">
                Flow State keeps your tasks, your calendar and the people you plan with in one place, and shows you when you’re actually free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-flow-green text-gray-900 font-semibold rounded-xl hover:bg-white text-lg"
                >
                  Get started free <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/70 text-white font-semibold rounded-xl hover:bg-white/10 text-lg"
                >
                  Log in
                </Link>
              </div>
              <p className="mt-5 text-sm text-white/75">Free to use · Works on phone, tablet and desktop · Exports to Apple Calendar</p>
            </div>
            <HeroMockup />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-4xl sm:text-5xl text-flow-purple mb-3">Everything in one place</h2>
            <p className="text-lg text-gray-600">No more switching between a to-do app, a calendar and a group chat to plan your week.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, body, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-gray-800" />
                </div>
                <h3 className="font-sans font-bold text-lg text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shared calendars */}
        <section id="shared" className="bg-flow-lavender scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-flow-purple mb-2">Shared calendars</p>
              <h2 className="font-heading text-4xl sm:text-5xl text-gray-900 mb-4">Plan together with one link</h2>
              <p className="text-lg text-gray-700 mb-8">
                Chores with roommates, group projects, team shifts or family plans. Everyone adds to the same calendar, and you decide who can edit and who can only view.
              </p>
              <ol className="space-y-5">
                {steps.map(s => (
                  <li key={s.n} className="flex gap-4">
                    <span className="h-10 w-10 shrink-0 rounded-full bg-flow-purple text-white font-heading text-xl flex items-center justify-center">{s.n}</span>
                    <div>
                      <h3 className="font-sans font-bold text-gray-900">{s.title}</h3>
                      <p className="text-gray-700">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md w-full mx-auto" aria-hidden>
              <div className="font-heading text-2xl text-gray-900 mb-4">Share “Apartment 4B”</div>
              <div className="flex gap-2 mb-6">
                <div className="flex-1 min-w-0 truncate border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-600 flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0" /> flowstatemanage.com/join/…
                </div>
                <div className="px-4 py-2.5 bg-flow-purple text-white rounded-xl text-sm font-medium">Share</div>
              </div>
              {[
                ['Alex', 'Owner', '#8894d1'],
                ['Jordan', 'Can edit', '#dfa4c6'],
                ['Morgan', 'Can edit', '#7cc47f'],
              ].map(([name, role, c]) => (
                <div key={name} className="flex items-center gap-3 py-2.5 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-heading" style={{ backgroundColor: c }}>{name[0]}</div>
                  <div className="flex-1 text-sm font-medium text-gray-900">{name}</div>
                  <div className="text-xs text-gray-500">{role}</div>
                </div>
              ))}
              <div className="mt-4 space-y-2">
                {[['Take out recycling', true], ['Buy dish soap', false]].map(([t, done]) => (
                  <div key={t as string} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-5 w-5 ${done ? 'text-green-600' : 'text-gray-300'}`} />
                    <span className={done ? 'line-through text-gray-400' : 'text-gray-800'}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Free time */}
        <section id="free-time" className="max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center scroll-mt-16">
          <div className="order-2 lg:order-1 bg-white rounded-3xl shadow-xl p-6 max-w-md w-full mx-auto" aria-hidden>
            <div className="font-heading text-2xl text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-flow-purple" /> When everyone’s free
            </div>
            <div className="text-xs text-gray-500 mb-4">Open for all 3 members this week</div>
            {[
              ['Tuesday', ['9–11am · 2h']],
              ['Thursday', ['1–4pm · 3h', '7–10pm · 3h']],
              ['Saturday', ['10am–2pm · 4h']],
            ].map(([day, slots]) => (
              <div key={day as string} className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{day}</div>
                {(slots as string[]).map(s => (
                  <div key={s} className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-gray-800 mb-1.5">{s}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-flow-purple mb-2">Free time finder</p>
            <h2 className="font-heading text-4xl sm:text-5xl text-gray-900 mb-4">See your free time at a glance</h2>
            <p className="text-lg text-gray-700 mb-6">
              Tell Flow State your hours and how much time you need. It checks your events and shared calendars, then lists every open slot for the week. Tap one to plan something there.
            </p>
            <ul className="space-y-3 text-gray-700">
              {[
                'Free slots are highlighted right on your calendar',
                'On a shared calendar, it finds times when everyone is free',
                'Only free or busy is shared. Nobody sees what your other events are.',
              ].map(t => (
                <li key={t} className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /> {t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mobile */}
        <section id="mobile" className="bg-flow-green/70 scroll-mt-16">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <Smartphone className="h-10 w-10 mx-auto text-gray-800 mb-4" />
            <h2 className="font-heading text-4xl sm:text-5xl text-gray-900 mb-3">Take it with you</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Flow State is built for phones as well as desktops. Open it in your phone’s browser and add it to your home screen. Our iPhone app is on the way.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-flow-purple">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h2 className="font-heading text-5xl sm:text-6xl text-flow-green mb-4">Ready to find your flow?</h2>
            <p className="text-lg text-white/90 mb-8">Create a free account and get your week in order.</p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-flow-green text-gray-900 font-semibold rounded-xl hover:bg-white text-lg"
            >
              Get started free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="" className="h-7 w-7 object-contain" />
            <span>© {new Date().getFullYear()} Flow State</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-white">Log in</Link>
            <Link to="/register" className="hover:text-white">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
