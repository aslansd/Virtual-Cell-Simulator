import { Particle, Channel, MoleculeType, ChannelType } from './types';

// Standard canvas coordinates
export const CANVAS_WIDTH = 750;
export const CANVAS_HEIGHT = 380;
export const MEMBRANE_Y = 190;
export const LIPID_RADIUS = 6;

// Spawn standard particle
export function createParticle(
  type: MoleculeType,
  area: 'inside' | 'outside',
  customId?: string
): Particle {
  const id = customId || `${type}-${Math.random().toString(36).substr(2, 9)}`;
  const radius = type === 'Glucose' ? 8 : type === 'ATP' ? 9 : type === 'Water' ? 5 : type === 'Proton' ? 4 : 5;
  
  // Set color matching a friendly palette
  let color = '#38bdf8'; // Default sky blue
  if (type === 'O2') color = '#22c55e'; // Green
  else if (type === 'CO2') color = '#f97316'; // Orange
  else if (type === 'Glucose') color = '#ec4899'; // Vibrant Pink
  else if (type === 'Water') color = '#0284c7'; // Deep Water Blue
  else if (type === 'Proton') color = '#eab308'; // Sparkly yellow
  else if (type === 'ATP') color = '#a855f7'; // Purple energy

  // Calculate coordinates based on area
  const margin = 20;
  const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
  let y = 0;
  if (area === 'outside') {
    y = margin + Math.random() * (MEMBRANE_Y - radius - margin - 15);
  } else {
    y = MEMBRANE_Y + radius + 15 + Math.random() * (CANVAS_HEIGHT - MEMBRANE_Y - radius - margin - 20);
  }

  // Soft random speed
  const maxSpeed = 1.6;
  const vx = (Math.random() - 0.5) * maxSpeed;
  const vy = (Math.random() - 0.5) * maxSpeed;

  return {
    id,
    type,
    x,
    y,
    vx: vx === 0 ? 0.5 : vx,
    vy: vy === 0 ? 0.5 : vy,
    radius,
    color,
  };
}

// Check if a point is within standard channel scope
export function findNearbyChannel(
  x: number,
  channels: Channel[],
  widthLimit = 22
): Channel | null {
  for (const channel of channels) {
    if (Math.abs(x - channel.x) < widthLimit && channel.isOpen) {
      return channel;
    }
  }
  return null;
}

// Helper to update full physical framework of particles
export function updateParticlesPhysics(
  particles: Particle[],
  channels: Channel[],
  onATPUse: () => void,
  onATPSynthasePassed: () => void
): { updatedParticles: Particle[]; events: string[] } {
  const updatedParticles: Particle[] = [];
  const events: string[] = [];

  for (const p of particles) {
    let nextX = p.x + p.vx;
    let nextY = p.y + p.vy;
    let nextVx = p.vx;
    let nextVy = p.vy;
    let crossedMembrane = false;
    let isBouncing = false;

    // Bounce off left/right walls
    if (nextX - p.radius < 0) {
      nextX = p.radius;
      nextVx = -p.vx;
      isBouncing = true;
    } else if (nextX + p.radius > CANVAS_WIDTH) {
      nextX = CANVAS_WIDTH - p.radius;
      nextVx = -p.vx;
      isBouncing = true;
    }

    // Bounce off top/bottom walls
    if (nextY - p.radius < 0) {
      nextY = p.radius;
      nextVy = -p.vy;
      isBouncing = true;
    } else if (nextY + p.radius > CANVAS_HEIGHT) {
      nextY = CANVAS_HEIGHT - p.radius;
      nextVy = -p.vy;
      isBouncing = true;
    }

    // Membrane logic: membrane is around MEMBRANE_Y (y=190)
    const currentY = p.y;
    
    // Check if particle is trying to cross the membrane barrier
    // Membrane boundary layer is from MEMBRANE_Y - 12 to MEMBRANE_Y + 12
    const insideBoundaryBefore = currentY < MEMBRANE_Y;
    const insideBoundaryAfter = nextY >= MEMBRANE_Y;
    const outsideBoundaryBefore = currentY >= MEMBRANE_Y;
    const outsideBoundaryAfter = nextY < MEMBRANE_Y;

    const crossingDown = insideBoundaryBefore && insideBoundaryAfter;
    const crossingUp = outsideBoundaryBefore && outsideBoundaryAfter;

    if (crossingDown || crossingUp) {
      // Oxygen and Carbon Dioxide pass directly through the double lipid layer! (Passive Simple Diffusion)
      if (p.type === 'O2' || p.type === 'CO2') {
        // They cross freely, with a slight visual slowing down/friction!
        nextY = nextY; // pass through
        crossedMembrane = true;
      } else {
        // Other molecules require protein channels! Let's check if there is an active channel at x-coordinate
        const channel = findNearbyChannel(nextX, channels, 24);
        
        if (channel) {
          // If a channel exists, let's see which channel type allows which molecule types!
          let allowed = false;

          if (channel.type === 'Aquaporin' && p.type === 'Water') {
            allowed = true;
          } 
          else if (channel.type === 'GlucoseCarrier' && p.type === 'Glucose') {
            allowed = true; // Passive facilitated transport
          } 
          else if (channel.type === 'GlucoseActivePump' && p.type === 'Glucose') {
            // Active transport! Pumps Glucose INTO cell (down) against gradient
            // Only works if y values flow from top to bottom (outside to inside)
            if (crossingDown) {
              allowed = true;
              onATPUse(); // consume gold coin ATP!
              events.push('ATP_CONSUMED');
              channel.activityTimer = 20; // light up channel for feedback
            } else {
              // glucose trying to slip back up is blocked unless pumped or slips
              allowed = false;
            }
          } 
          else if (channel.type === 'ProtonPump' && p.type === 'Proton') {
            // Pumps Protons from inside (bottom) to outside (top) using ATP!
            if (crossingUp) {
              allowed = true;
              onATPUse();
              events.push('ATP_CONSUMED');
              channel.activityTimer = 20;
            } else {
              allowed = false; // block proton leaking back down unless via synthase
            }
          } 
          else if (channel.type === 'ATPSynthase' && p.type === 'Proton') {
            // Allows Protons to flow DOWN (outside to inside - top to bottom)
            if (crossingDown) {
              allowed = true;
              // Synthase triggers turbine spinning and creates ATP!
              onATPSynthasePassed();
              events.push('ATP_MADE');
              channel.activityTimer = 20;
              // Add rotational spin
              channel.angle = (channel.angle || 0) + 1.2;
            }
          }

          if (allowed) {
            crossedMembrane = true;
          } else {
            // Refuse entry and bounce off!
            nextVy = -p.vy;
            nextY = crossingDown ? MEMBRANE_Y - p.radius : MEMBRANE_Y + p.radius;
            isBouncing = true;
          }
        } else {
          // No channel here: Bounce back!
          nextVy = -p.vy;
          nextY = crossingDown ? MEMBRANE_Y - p.radius : MEMBRANE_Y + p.radius;
          isBouncing = true;
        }
      }
    }

    // Add particle with updated physics
    updatedParticles.push({
      ...p,
      x: nextX,
      y: nextY,
      vx: nextVx,
      vy: nextVy,
      isBouncing,
    });
  }

  return { updatedParticles, events };
}

// Count molecules in inside vs outside regions
export function getMoleculeCounts(particles: Particle[]) {
  const counts = {
    outside: { O2: 0, CO2: 0, Glucose: 0, Water: 0, Proton: 0, ATP: 0 },
    inside: { O2: 0, CO2: 0, Glucose: 0, Water: 0, Proton: 0, ATP: 0 }
  };

  for (const p of particles) {
    const area = p.y < MEMBRANE_Y ? 'outside' : 'inside';
    counts[area][p.type]++;
  }

  return counts;
}
