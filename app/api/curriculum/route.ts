import { NextRequest, NextResponse } from 'next/server';
import { getCurricula, createCurriculumTag } from '@/lib/db-helpers-mongo';

export async function GET(request: NextRequest) {
  try {
    const curricula = await getCurricula();
    return NextResponse.json({ curricula });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createCurriculumTag(body);
    return NextResponse.json({ id, ...body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

