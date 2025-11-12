import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  symbol: z.string().min(1),
  publishTime: z.string().datetime(),
  zoneType: z.enum(['support', 'resistance']),
  zonePrice: z.number().positive(),
});

// GET - Fetch settings for a specific symbol
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      // Return all settings for the user
      const settings = await prisma.coinSettings.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json(settings);
    }

    // Return settings for specific symbol
    const setting = await prisma.coinSettings.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol,
        },
      },
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, publishTime, zoneType, zonePrice } = settingsSchema.parse(body);

    // Upsert settings
    const setting = await prisma.coinSettings.upsert({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol,
        },
      },
      update: {
        publishTime: new Date(publishTime),
        zoneType,
        zonePrice,
      },
      create: {
        userId: session.user.id,
        symbol,
        publishTime: new Date(publishTime),
        zoneType,
        zonePrice,
      },
    });

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Save settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete settings for a symbol
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter required' },
        { status: 400 }
      );
    }

    await prisma.coinSettings.deleteMany({
      where: {
        userId: session.user.id,
        symbol,
      },
    });

    return NextResponse.json({ message: 'Settings deleted' });
  } catch (error) {
    console.error('Delete settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
