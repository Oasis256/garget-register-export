/**
 * Garget Register — Comprehensive Category & Parts Catalog
 * Shared between frontend (RegisterAsset) and backend (routers).
 *
 * Each category defines:
 *  - label: Human-readable display name
 *  - icon: Lucide icon name string (used in frontend)
 *  - hasImei: Whether the item has an IMEI number
 *  - hasVin: Whether the item has a VIN / chassis number
 *  - parts: Removable/registerable parts for this category
 *    Each part has:
 *      - id: Unique key used as the child asset's partType
 *      - label: Display name
 *      - serializable: Whether this part typically has its own serial number
 *      - required: Whether this part is always present (pre-checked by default)
 */

export interface PartDefinition {
  id: string;
  label: string;
  serializable: boolean;
  required?: boolean;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  icon: string;
  hasImei?: boolean;
  hasVin?: boolean;
  hasPlate?: boolean;
  parts: PartDefinition[];
}

export const CATEGORIES: CategoryDefinition[] = [
  // ─── VEHICLES ───────────────────────────────────────────────────────────────
  {
    id: "vehicle",
    label: "Vehicle (Car / Truck / Bus)",
    icon: "Car",
    hasVin: true,
    hasPlate: true,
    parts: [
      { id: "engine", label: "Engine", serializable: true, required: true },
      { id: "gearbox", label: "Gearbox / Transmission", serializable: true },
      { id: "chassis", label: "Chassis / Frame", serializable: true, required: true },
      { id: "battery", label: "Battery", serializable: true },
      { id: "alternator", label: "Alternator", serializable: true },
      { id: "starter_motor", label: "Starter Motor", serializable: true },
      { id: "radiator", label: "Radiator", serializable: false },
      { id: "dashboard", label: "Dashboard / Instrument Cluster", serializable: true },
      { id: "steering_wheel", label: "Steering Wheel", serializable: false },
      { id: "front_bumper", label: "Front Bumper", serializable: false },
      { id: "rear_bumper", label: "Rear Bumper", serializable: false },
      { id: "bonnet", label: "Bonnet / Hood", serializable: false },
      { id: "boot_lid", label: "Boot Lid / Tailgate", serializable: false },
      { id: "door_front_left", label: "Front Left Door", serializable: false },
      { id: "door_front_right", label: "Front Right Door", serializable: false },
      { id: "door_rear_left", label: "Rear Left Door", serializable: false },
      { id: "door_rear_right", label: "Rear Right Door", serializable: false },
      { id: "tyre_front_left", label: "Tyre — Front Left", serializable: true },
      { id: "tyre_front_right", label: "Tyre — Front Right", serializable: true },
      { id: "tyre_rear_left", label: "Tyre — Rear Left", serializable: true },
      { id: "tyre_rear_right", label: "Tyre — Rear Right", serializable: true },
      { id: "spare_tyre", label: "Spare Tyre", serializable: true },
      { id: "rim_set", label: "Alloy Rims (set)", serializable: false },
      { id: "catalytic_converter", label: "Catalytic Converter", serializable: true },
      { id: "fuel_pump", label: "Fuel Pump", serializable: true },
      { id: "ecu", label: "ECU / Engine Control Unit", serializable: true },
      { id: "airbag_set", label: "Airbag Set", serializable: true },
      { id: "car_stereo", label: "Car Stereo / Head Unit", serializable: true },
      { id: "spare_wheel", label: "Spare Wheel", serializable: false },
      { id: "jack_toolkit", label: "Jack & Toolkit", serializable: false },
      { id: "number_plates", label: "Number Plates", serializable: false },
    ],
  },

  // ─── MOTORCYCLE ─────────────────────────────────────────────────────────────
  {
    id: "motorcycle",
    label: "Motorcycle / Boda Boda",
    icon: "Bike",
    hasVin: true,
    hasPlate: true,
    parts: [
      { id: "engine", label: "Engine", serializable: true, required: true },
      { id: "chassis", label: "Chassis / Frame", serializable: true, required: true },
      { id: "fuel_tank", label: "Fuel Tank", serializable: false },
      { id: "battery", label: "Battery", serializable: true },
      { id: "front_fork", label: "Front Fork / Suspension", serializable: false },
      { id: "rear_shock", label: "Rear Shock Absorber", serializable: false },
      { id: "front_wheel", label: "Front Wheel & Tyre", serializable: true },
      { id: "rear_wheel", label: "Rear Wheel & Tyre", serializable: true },
      { id: "headlight", label: "Headlight Assembly", serializable: false },
      { id: "speedometer", label: "Speedometer / Dashboard", serializable: true },
      { id: "exhaust", label: "Exhaust Pipe / Silencer", serializable: false },
      { id: "seat", label: "Seat", serializable: false },
      { id: "number_plates", label: "Number Plates", serializable: false },
      { id: "side_mirrors", label: "Side Mirrors", serializable: false },
      { id: "carrier_rack", label: "Carrier Rack", serializable: false },
    ],
  },

  // ─── BICYCLE ────────────────────────────────────────────────────────────────
  {
    id: "bicycle",
    label: "Bicycle",
    icon: "Bike",
    parts: [
      { id: "frame", label: "Frame", serializable: true, required: true },
      { id: "front_wheel", label: "Front Wheel", serializable: false },
      { id: "rear_wheel", label: "Rear Wheel", serializable: false },
      { id: "handlebar", label: "Handlebar", serializable: false },
      { id: "saddle", label: "Saddle / Seat", serializable: false },
      { id: "front_fork", label: "Front Fork", serializable: false },
      { id: "gears_set", label: "Gear Set / Derailleur", serializable: true },
      { id: "brakes", label: "Brake Set", serializable: false },
      { id: "chain", label: "Chain", serializable: false },
      { id: "pedals", label: "Pedals", serializable: false },
      { id: "lights", label: "Lights (front & rear)", serializable: false },
      { id: "lock", label: "Lock", serializable: true },
    ],
  },

  // ─── SMARTPHONE ─────────────────────────────────────────────────────────────
  {
    id: "smartphone",
    label: "Smartphone",
    icon: "Smartphone",
    hasImei: true,
    parts: [
      { id: "main_board", label: "Motherboard / Main PCB", serializable: true, required: true },
      { id: "battery", label: "Battery", serializable: true },
      { id: "screen", label: "Screen / Display Assembly", serializable: true },
      { id: "back_cover", label: "Back Cover / Housing", serializable: false },
      { id: "camera_module", label: "Camera Module", serializable: true },
      { id: "fingerprint_sensor", label: "Fingerprint Sensor", serializable: false },
      { id: "charging_port", label: "Charging Port Board", serializable: false },
      { id: "sim_tray", label: "SIM Tray", serializable: false },
      { id: "earpiece", label: "Earpiece / Speaker", serializable: false },
      { id: "charger", label: "Original Charger", serializable: true },
      { id: "earphones", label: "Original Earphones", serializable: false },
      { id: "box", label: "Original Box", serializable: false },
    ],
  },

  // ─── TABLET ─────────────────────────────────────────────────────────────────
  {
    id: "tablet",
    label: "Tablet",
    icon: "Tablet",
    hasImei: true,
    parts: [
      { id: "main_board", label: "Motherboard / Main PCB", serializable: true, required: true },
      { id: "battery", label: "Battery", serializable: true },
      { id: "screen", label: "Screen / Display Assembly", serializable: true },
      { id: "back_cover", label: "Back Cover / Housing", serializable: false },
      { id: "camera_module", label: "Camera Module", serializable: true },
      { id: "charging_port", label: "Charging Port Board", serializable: false },
      { id: "keyboard_cover", label: "Keyboard Cover / Folio", serializable: false },
      { id: "stylus", label: "Stylus / Pen", serializable: true },
      { id: "charger", label: "Original Charger", serializable: true },
      { id: "box", label: "Original Box", serializable: false },
    ],
  },

  // ─── LAPTOP ─────────────────────────────────────────────────────────────────
  {
    id: "laptop",
    label: "Laptop",
    icon: "Laptop",
    parts: [
      { id: "main_board", label: "Motherboard / Main PCB", serializable: true, required: true },
      { id: "battery", label: "Battery Pack", serializable: true },
      { id: "screen", label: "Screen / LCD Assembly", serializable: true },
      { id: "keyboard", label: "Keyboard", serializable: false },
      { id: "ram", label: "RAM Modules", serializable: true },
      { id: "ssd_hdd", label: "SSD / Hard Drive", serializable: true },
      { id: "gpu", label: "GPU / Graphics Card (if removable)", serializable: true },
      { id: "wifi_card", label: "Wi-Fi / Bluetooth Card", serializable: true },
      { id: "charger", label: "Original Charger / Adapter", serializable: true },
      { id: "bottom_cover", label: "Bottom Cover / Base", serializable: false },
      { id: "top_cover", label: "Top Cover / Lid", serializable: false },
      { id: "touchpad", label: "Touchpad", serializable: false },
      { id: "cooling_fan", label: "Cooling Fan", serializable: false },
      { id: "dvd_drive", label: "DVD / Optical Drive", serializable: false },
      { id: "box", label: "Original Box", serializable: false },
    ],
  },

  // ─── DESKTOP COMPUTER ───────────────────────────────────────────────────────
  {
    id: "desktop",
    label: "Desktop Computer",
    icon: "Monitor",
    parts: [
      { id: "cpu", label: "CPU / Processor", serializable: true, required: true },
      { id: "motherboard", label: "Motherboard", serializable: true, required: true },
      { id: "ram", label: "RAM Modules", serializable: true },
      { id: "gpu", label: "GPU / Graphics Card", serializable: true },
      { id: "ssd_hdd", label: "SSD / Hard Drive", serializable: true },
      { id: "psu", label: "Power Supply Unit (PSU)", serializable: true },
      { id: "case", label: "Computer Case / Tower", serializable: false },
      { id: "cpu_cooler", label: "CPU Cooler / Heatsink", serializable: false },
      { id: "case_fans", label: "Case Fans", serializable: false },
      { id: "optical_drive", label: "DVD / Optical Drive", serializable: false },
      { id: "monitor", label: "Monitor / Display", serializable: true },
      { id: "keyboard", label: "Keyboard", serializable: false },
      { id: "mouse", label: "Mouse", serializable: false },
      { id: "webcam", label: "Webcam", serializable: true },
      { id: "speakers", label: "Speakers", serializable: true },
      { id: "ups", label: "UPS / Battery Backup", serializable: true },
    ],
  },

  // ─── TELEVISION ─────────────────────────────────────────────────────────────
  {
    id: "television",
    label: "Television / Smart TV",
    icon: "Tv",
    parts: [
      { id: "main_board", label: "Main Board / PCB", serializable: true, required: true },
      { id: "screen_panel", label: "Screen Panel", serializable: true },
      { id: "power_board", label: "Power Supply Board", serializable: true },
      { id: "t_con_board", label: "T-CON Board", serializable: true },
      { id: "remote_control", label: "Remote Control", serializable: false },
      { id: "stand", label: "Stand / Base", serializable: false },
      { id: "back_cover", label: "Back Cover", serializable: false },
      { id: "speakers_internal", label: "Internal Speakers", serializable: false },
      { id: "wall_mount", label: "Wall Mount Bracket", serializable: false },
    ],
  },

  // ─── GENERATOR ──────────────────────────────────────────────────────────────
  {
    id: "generator",
    label: "Generator",
    icon: "Zap",
    parts: [
      { id: "engine", label: "Engine", serializable: true, required: true },
      { id: "alternator_head", label: "Alternator Head", serializable: true },
      { id: "fuel_tank", label: "Fuel Tank", serializable: false },
      { id: "avr", label: "AVR (Automatic Voltage Regulator)", serializable: true },
      { id: "control_panel", label: "Control Panel", serializable: false },
      { id: "battery", label: "Battery (electric start)", serializable: true },
      { id: "frame", label: "Frame / Chassis", serializable: false },
      { id: "wheels", label: "Wheels / Trolley", serializable: false },
      { id: "exhaust", label: "Exhaust / Muffler", serializable: false },
      { id: "air_filter", label: "Air Filter", serializable: false },
    ],
  },

  // ─── REFRIGERATOR / FRIDGE ──────────────────────────────────────────────────
  {
    id: "refrigerator",
    label: "Refrigerator / Freezer",
    icon: "Thermometer",
    parts: [
      { id: "compressor", label: "Compressor", serializable: true, required: true },
      { id: "main_pcb", label: "Main Control PCB", serializable: true },
      { id: "condenser", label: "Condenser Unit", serializable: false },
      { id: "evaporator", label: "Evaporator", serializable: false },
      { id: "door_main", label: "Main Door", serializable: false },
      { id: "door_freezer", label: "Freezer Door", serializable: false },
      { id: "shelves", label: "Shelves & Drawers", serializable: false },
      { id: "ice_maker", label: "Ice Maker Unit", serializable: true },
      { id: "water_dispenser", label: "Water Dispenser Module", serializable: true },
    ],
  },

  // ─── WASHING MACHINE ────────────────────────────────────────────────────────
  {
    id: "washing_machine",
    label: "Washing Machine",
    icon: "Wind",
    parts: [
      { id: "motor", label: "Motor", serializable: true, required: true },
      { id: "main_pcb", label: "Main Control PCB", serializable: true },
      { id: "drum", label: "Drum / Tub", serializable: false },
      { id: "pump", label: "Drain Pump", serializable: false },
      { id: "door", label: "Door / Lid", serializable: false },
      { id: "door_lock", label: "Door Lock Module", serializable: false },
      { id: "water_inlet_valve", label: "Water Inlet Valve", serializable: false },
      { id: "heating_element", label: "Heating Element", serializable: false },
      { id: "dispenser_drawer", label: "Detergent Dispenser Drawer", serializable: false },
    ],
  },

  // ─── CAMERA ─────────────────────────────────────────────────────────────────
  {
    id: "camera",
    label: "Camera (DSLR / Mirrorless / Video)",
    icon: "Camera",
    parts: [
      { id: "camera_body", label: "Camera Body", serializable: true, required: true },
      { id: "lens_kit", label: "Kit Lens", serializable: true },
      { id: "lens_extra_1", label: "Extra Lens 1", serializable: true },
      { id: "lens_extra_2", label: "Extra Lens 2", serializable: true },
      { id: "battery", label: "Battery Pack", serializable: true },
      { id: "battery_grip", label: "Battery Grip", serializable: true },
      { id: "flash", label: "External Flash / Speedlight", serializable: true },
      { id: "memory_card", label: "Memory Card(s)", serializable: true },
      { id: "tripod", label: "Tripod", serializable: false },
      { id: "camera_bag", label: "Camera Bag / Case", serializable: false },
      { id: "charger", label: "Battery Charger", serializable: false },
      { id: "remote_shutter", label: "Remote Shutter", serializable: false },
    ],
  },

  // ─── AUDIO / SOUND SYSTEM ───────────────────────────────────────────────────
  {
    id: "audio_system",
    label: "Audio / Sound System",
    icon: "Music",
    parts: [
      { id: "amplifier", label: "Amplifier / Receiver", serializable: true, required: true },
      { id: "speaker_main_left", label: "Main Speaker — Left", serializable: true },
      { id: "speaker_main_right", label: "Main Speaker — Right", serializable: true },
      { id: "subwoofer", label: "Subwoofer", serializable: true },
      { id: "centre_speaker", label: "Centre Speaker", serializable: true },
      { id: "surround_left", label: "Surround Speaker — Left", serializable: true },
      { id: "surround_right", label: "Surround Speaker — Right", serializable: true },
      { id: "cd_dvd_player", label: "CD / DVD Player", serializable: true },
      { id: "turntable", label: "Turntable / Record Player", serializable: true },
      { id: "microphone", label: "Microphone(s)", serializable: true },
      { id: "mixer", label: "Mixing Board", serializable: true },
      { id: "remote_control", label: "Remote Control", serializable: false },
      { id: "cables_set", label: "Cable Set", serializable: false },
    ],
  },

  // ─── PRINTER / SCANNER ──────────────────────────────────────────────────────
  {
    id: "printer",
    label: "Printer / Scanner / Copier",
    icon: "Printer",
    parts: [
      { id: "main_unit", label: "Main Unit", serializable: true, required: true },
      { id: "main_pcb", label: "Main Control PCB", serializable: true },
      { id: "print_head", label: "Print Head", serializable: true },
      { id: "ink_system", label: "Ink Tank / Cartridge System", serializable: false },
      { id: "scanner_unit", label: "Scanner Unit", serializable: true },
      { id: "adf", label: "ADF (Auto Document Feeder)", serializable: false },
      { id: "paper_tray", label: "Paper Tray(s)", serializable: false },
      { id: "power_supply", label: "Power Supply Board", serializable: false },
      { id: "drum_unit", label: "Drum Unit (laser)", serializable: true },
      { id: "fuser_unit", label: "Fuser Unit (laser)", serializable: true },
    ],
  },

  // ─── PROJECTOR ──────────────────────────────────────────────────────────────
  {
    id: "projector",
    label: "Projector",
    icon: "Video",
    parts: [
      { id: "main_unit", label: "Main Unit", serializable: true, required: true },
      { id: "lamp", label: "Projector Lamp / Bulb", serializable: true },
      { id: "lens", label: "Lens", serializable: true },
      { id: "remote_control", label: "Remote Control", serializable: false },
      { id: "carry_case", label: "Carry Case / Bag", serializable: false },
      { id: "power_cable", label: "Power Cable", serializable: false },
      { id: "hdmi_cable", label: "HDMI / VGA Cable", serializable: false },
    ],
  },

  // ─── POWER TOOLS ────────────────────────────────────────────────────────────
  {
    id: "power_tools",
    label: "Power Tools (Drill, Saw, etc.)",
    icon: "Wrench",
    parts: [
      { id: "main_unit", label: "Main Tool Unit", serializable: true, required: true },
      { id: "battery_pack", label: "Battery Pack(s)", serializable: true },
      { id: "charger", label: "Battery Charger", serializable: true },
      { id: "carry_case", label: "Carry Case", serializable: false },
      { id: "blades_bits", label: "Blades / Drill Bits Set", serializable: false },
      { id: "accessories", label: "Accessories Set", serializable: false },
    ],
  },

  // ─── SOLAR SYSTEM ───────────────────────────────────────────────────────────
  {
    id: "solar_system",
    label: "Solar Power System",
    icon: "Sun",
    parts: [
      { id: "inverter", label: "Inverter / Charge Controller", serializable: true, required: true },
      { id: "solar_panel_1", label: "Solar Panel 1", serializable: true },
      { id: "solar_panel_2", label: "Solar Panel 2", serializable: true },
      { id: "solar_panel_3", label: "Solar Panel 3", serializable: true },
      { id: "solar_panel_4", label: "Solar Panel 4", serializable: true },
      { id: "battery_bank", label: "Battery Bank", serializable: true },
      { id: "battery_1", label: "Battery 1", serializable: true },
      { id: "battery_2", label: "Battery 2", serializable: true },
      { id: "battery_3", label: "Battery 3", serializable: true },
      { id: "battery_4", label: "Battery 4", serializable: true },
      { id: "mounting_frame", label: "Mounting Frame / Rack", serializable: false },
      { id: "cables_set", label: "Cable Set", serializable: false },
    ],
  },

  // ─── AGRICULTURAL EQUIPMENT ─────────────────────────────────────────────────
  {
    id: "agri_equipment",
    label: "Agricultural Equipment (Tractor, Pump, etc.)",
    icon: "Tractor",
    parts: [
      { id: "engine", label: "Engine", serializable: true, required: true },
      { id: "chassis", label: "Chassis / Frame", serializable: true },
      { id: "gearbox", label: "Gearbox", serializable: true },
      { id: "hydraulic_system", label: "Hydraulic System", serializable: false },
      { id: "pto", label: "PTO (Power Take-Off)", serializable: false },
      { id: "front_axle", label: "Front Axle", serializable: false },
      { id: "rear_axle", label: "Rear Axle", serializable: false },
      { id: "tyres_set", label: "Tyres (set of 4)", serializable: false },
      { id: "battery", label: "Battery", serializable: true },
      { id: "fuel_tank", label: "Fuel Tank", serializable: false },
      { id: "implement_attachment", label: "Implement / Attachment", serializable: true },
    ],
  },

  // ─── MEDICAL EQUIPMENT ──────────────────────────────────────────────────────
  {
    id: "medical_equipment",
    label: "Medical Equipment",
    icon: "HeartPulse",
    parts: [
      { id: "main_unit", label: "Main Unit", serializable: true, required: true },
      { id: "power_supply", label: "Power Supply", serializable: true },
      { id: "display_unit", label: "Display / Monitor Unit", serializable: true },
      { id: "probe_sensor", label: "Probe / Sensor", serializable: true },
      { id: "cables_leads", label: "Cables / Leads Set", serializable: false },
      { id: "carry_case", label: "Carry Case", serializable: false },
      { id: "accessories", label: "Accessories Set", serializable: false },
    ],
  },

  // ─── OFFICE FURNITURE / HIGH-VALUE ITEMS ────────────────────────────────────
  {
    id: "high_value_item",
    label: "High-Value Item (Jewellery, Art, Safe, etc.)",
    icon: "Gem",
    parts: [
      { id: "main_item", label: "Main Item", serializable: true, required: true },
      { id: "certificate", label: "Certificate of Authenticity", serializable: true },
      { id: "case_box", label: "Case / Box", serializable: false },
      { id: "accessories", label: "Accessories / Components", serializable: false },
    ],
  },

  // ─── OTHER ELECTRONICS ──────────────────────────────────────────────────────
  {
    id: "other_electronics",
    label: "Other Electronics",
    icon: "Cpu",
    parts: [
      { id: "main_unit", label: "Main Unit", serializable: true, required: true },
      { id: "power_supply", label: "Power Supply / Adapter", serializable: true },
      { id: "remote_control", label: "Remote Control", serializable: false },
      { id: "accessories", label: "Accessories", serializable: false },
      { id: "carry_case", label: "Carry Case / Bag", serializable: false },
      { id: "original_box", label: "Original Box", serializable: false },
    ],
  },

  // ─── OTHER / CUSTOM ─────────────────────────────────────────────────────────
  {
    id: "other",
    label: "Other Item",
    icon: "Package",
    parts: [
      { id: "main_item", label: "Main Item", serializable: true, required: true },
      { id: "component_1", label: "Component 1", serializable: true },
      { id: "component_2", label: "Component 2", serializable: true },
      { id: "component_3", label: "Component 3", serializable: true },
      { id: "accessories", label: "Accessories", serializable: false },
    ],
  },
];

/** Quick lookup by category id */
export const CATEGORY_MAP = new Map<string, CategoryDefinition>(
  CATEGORIES.map((c) => [c.id, c])
);

/** All category ids for use in Zod enums and DB enums */
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

/** Get parts for a given category id */
export function getPartsForCategory(categoryId: string): PartDefinition[] {
  return CATEGORY_MAP.get(categoryId)?.parts ?? [];
}

/** Get default-checked parts (required: true) for a category */
export function getDefaultParts(categoryId: string): string[] {
  return getPartsForCategory(categoryId)
    .filter((p) => p.required)
    .map((p) => p.id);
}
