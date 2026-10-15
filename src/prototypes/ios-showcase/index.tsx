import { useState } from "react";
import { motion } from "motion/react";
import {
  Archive,
  Bell,
  Bluetooth,
  Calendar,
  Check,
  Compass,
  Ellipsis,
  Flag,
  Heart,
  MapPin,
  Moon,
  Plane,
  Settings,
  Share,
  Star,
  Trash2,
  Wifi,
} from "lucide-react";
import {
  ActionSheet,
  Alert,
  Button,
  Cell,
  CellIcon,
  GlassIconButton,
  List,
  Page,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  Stack,
  Stepper,
  TabView,
  Toast,
  Toggle,
  useStack,
  useStatusBarStyle,
} from "@/kit";

/* Placeholder destinations; gradients stand in for photography. */
const places = [
  { id: 1, name: "Santorini", country: "Greece", price: 2499, nights: 7, hue: 205, rating: 4.9 },
  { id: 2, name: "Kyoto", country: "Japan", price: 3199, nights: 9, hue: 345, rating: 4.8 },
  { id: 3, name: "Amalfi Coast", country: "Italy", price: 2899, nights: 6, hue: 28, rating: 4.9 },
  { id: 4, name: "Bora Bora", country: "French Polynesia", price: 5499, nights: 5, hue: 175, rating: 5.0 },
  { id: 5, name: "Marrakech", country: "Morocco", price: 1599, nights: 5, hue: 15, rating: 4.7 },
];
type Place = (typeof places)[number];

const art = (hue: number) =>
  `radial-gradient(120% 80% at 20% 10%, hsl(${hue} 90% 70%), transparent 60%), linear-gradient(160deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 75% 30%))`;

export default function Showcase() {
  return (
    <TabView
      minimizeOnScroll
      tabs={[
        { id: "discover", label: "Discover", icon: Compass, content: <Stack root={<Discover />} /> },
        { id: "trips", label: "Trips", icon: Plane, content: <Stack root={<Trips />} />, badge: 2 },
        { id: "settings", label: "Settings", icon: Settings, content: <Stack root={<SettingsScreen />} /> },
      ]}
      search={{ content: <Stack root={<SearchScreen />} /> }}
    />
  );
}

/* ---------------------------------------------------------------- Discover */

function Discover() {
  const nav = useStack()!;
  const [filter, setFilter] = useState<"All" | "Beach" | "City">("All");
  return (
    <Page
      title="Discover"
      trailing={
        <GlassIconButton aria-label="Notifications">
          <Bell size={20} strokeWidth={2.2} />
        </GlassIconButton>
      }
      header={<SegmentedControl options={["All", "Beach", "City"] as const} value={filter} onChange={setFilter} />}
    >
      <div className="flex flex-col gap-4 px-4 pt-2">
        {places.map((p) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => nav.push(<PlaceDetail place={p} />)}
            className="relative h-[220px] overflow-hidden rounded-[28px] text-left"
            style={{ background: art(p.hue) }}
          >
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16 text-white">
              <div className="text-caption1 font-semibold uppercase tracking-wide opacity-80">{p.country}</div>
              <div className="text-title2 font-bold">{p.name}</div>
              <div className="text-subhead opacity-90">
                {p.nights} nights from ${p.price.toLocaleString()}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </Page>
  );
}

function PlaceDetail({ place }: { place: Place }) {
  useStatusBarStyle("light");
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [guests, setGuests] = useState(2);

  return (
    <Page
      title={place.name}
      largeTitle={false}
      trailing={
        <>
          <GlassIconButton aria-label="Share">
            <Share size={19} strokeWidth={2.2} />
          </GlassIconButton>
          <GlassIconButton
            aria-label="Save"
            onClick={() => {
              setSaved(!saved);
              if (!saved) setToast(true);
            }}
          >
            <Heart size={20} strokeWidth={2.2} fill={saved ? "var(--ios-red)" : "none"} color={saved ? "var(--ios-red)" : "currentColor"} />
          </GlassIconButton>
        </>
      }
      bottomBar={
        <Button full onClick={() => setSheet(true)}>
          Check availability
        </Button>
      }
    >
      <div className="-mt-[calc(var(--safe-top)+54px)] h-[380px]" style={{ background: art(place.hue) }} />
      <div className="px-5 pt-5">
        <div className="text-subhead text-label-secondary">{place.country}</div>
        <h1 className="text-title1 font-bold text-label">{place.name}</h1>
        <div className="mt-2 flex items-center gap-3 text-subhead text-label-secondary">
          <span className="flex items-center gap-1">
            <Star size={14} fill="var(--ios-orange)" color="var(--ios-orange)" /> {place.rating}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {place.country}
          </span>
        </div>
        <p className="mt-4 text-body text-label">
          Whitewashed villages, volcanic beaches and long, golden evenings. This escape includes {place.nights} nights in a sea-view suite,
          daily breakfast, and a private sunset cruise.
        </p>
        <p className="mt-4 text-body text-label-secondary">
          Swipe from the left edge to go back, or tap the glass back button. Scroll to see the title move into the bar.
        </p>
        <div className="h-[400px]" />
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Your stay">
        <List>
          <Section>
            <Cell leading={<CellIcon icon={Calendar} color="var(--ios-red)" />} title="Dates" detail="12 – 19 Mar" accessory="chevron" onClick={() => {}} />
            <Cell
              leading={<CellIcon icon={Heart} color="var(--ios-pink)" />}
              title="Guests"
              accessory={<Stepper value={guests} onChange={setGuests} min={1} max={8} />}
              detail={String(guests)}
            />
          </Section>
          <Section footer="Drag the grabber to expand to the large detent, or down to dismiss.">
            <Cell title="Total" detail={`$${(place.price * guests).toLocaleString()}`} />
          </Section>
          <div className="px-4">
            <Button full onClick={() => setSheet(false)}>
              Reserve
            </Button>
          </div>
        </List>
      </Sheet>
      <Toast open={toast} onClose={() => setToast(false)} icon={<Heart size={16} fill="var(--ios-red)" color="var(--ios-red)" />} message="Saved to Wishlist" />
    </Page>
  );
}

/* ------------------------------------------------------------------- Trips */

function Trips() {
  const [trips, setTrips] = useState(places.slice(0, 4));
  const [confirm, setConfirm] = useState<Place | null>(null);
  return (
    <Page title="Trips" background="grouped">
      <List>
        <Section header="Upcoming" footer="Swipe a trip left for more actions.">
          {trips.map((p) => (
            <Cell
              key={p.id}
              leading={<span className="size-[44px] shrink-0 rounded-[12px]" style={{ background: art(p.hue) }} />}
              title={p.name}
              subtitle={`${p.nights} nights · ${p.country}`}
              accessory="chevron"
              onClick={() => {}}
              swipeActions={[
                { label: "Flag", color: "var(--ios-orange)", icon: <Flag size={18} />, onClick: () => {} },
                { label: "Delete", color: "var(--ios-red)", icon: <Trash2 size={18} />, onClick: () => setConfirm(p) },
              ]}
            />
          ))}
        </Section>
      </List>
      <Alert
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Cancel ${confirm?.name}?`}
        message="Your booking will be refunded to your original payment method."
        actions={[
          { label: "Keep", style: "cancel" },
          { label: "Cancel trip", style: "destructive", onPress: () => setTrips((t) => t.filter((x) => x.id !== confirm?.id)) },
        ]}
      />
    </Page>
  );
}

/* ---------------------------------------------------------------- Settings */

function SettingsScreen() {
  const nav = useStack()!;
  const [wifi, setWifi] = useState(true);
  const [menu, setMenu] = useState(false);
  return (
    <Page
      title="Settings"
      background="grouped"
      trailing={
        <GlassIconButton aria-label="More" onClick={() => setMenu(true)}>
          <Ellipsis size={22} strokeWidth={2.2} />
        </GlassIconButton>
      }
    >
      <List>
        <Section>
          <Cell leading={<CellIcon icon={Wifi} color="var(--ios-blue)" />} title="Wi-Fi" accessory={<Toggle checked={wifi} onChange={setWifi} />} />
          <Cell leading={<CellIcon icon={Bluetooth} color="var(--ios-blue)" />} title="Bluetooth" detail="On" accessory="chevron" onClick={() => nav.push(<Detail title="Bluetooth" />)} />
        </Section>
        <Section header="Notifications">
          <Cell leading={<CellIcon icon={Bell} color="var(--ios-red)" />} title="Notifications" accessory="chevron" onClick={() => nav.push(<Detail title="Notifications" />)} />
          <Cell leading={<CellIcon icon={Moon} color="var(--ios-indigo)" />} title="Focus" accessory="chevron" onClick={() => nav.push(<Detail title="Focus" />)} />
        </Section>
        <Section header="Buttons">
          <div className="flex flex-wrap gap-2 p-4">
            <Button size="medium">Filled</Button>
            <Button size="medium" variant="tinted">Tinted</Button>
            <Button size="medium" variant="gray">Gray</Button>
            <Button size="medium" variant="glass">Glass</Button>
            <Button size="medium" variant="plain">Plain</Button>
          </div>
        </Section>
      </List>
      <ActionSheet
        open={menu}
        onClose={() => setMenu(false)}
        title="Settings"
        actions={[
          { label: "Archive", icon: <Archive size={20} /> },
          { label: "Share", icon: <Share size={20} /> },
          { label: "Reset all", style: "destructive", icon: <Trash2 size={20} /> },
          { label: "Cancel", style: "cancel" },
        ]}
      />
    </Page>
  );
}

function Detail({ title }: { title: string }) {
  const [choice, setChoice] = useState("Always");
  return (
    <Page title={title} background="grouped">
      <List>
        <Section header="Show previews">
          {["Always", "When unlocked", "Never"].map((o) => (
            <Cell key={o} title={o} onClick={() => setChoice(o)} accessory={choice === o ? <Check size={20} strokeWidth={2.6} className="text-tint" /> : <span />} />
          ))}
        </Section>
      </List>
    </Page>
  );
}

/* ------------------------------------------------------------------ Search */

function SearchScreen() {
  const [q, setQ] = useState("");
  const results = places.filter((p) => `${p.name} ${p.country}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Page title="Search" bottomBar={<SearchField glass value={q} onChange={setQ} placeholder="Destinations, hotels…" />}>
      <List>
        <Section>
          {results.map((p) => (
            <Cell key={p.id} title={p.name} subtitle={p.country} leading={<span className="size-[30px] rounded-full" style={{ background: art(p.hue) }} />} />
          ))}
        </Section>
      </List>
    </Page>
  );
}
