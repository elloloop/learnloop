import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  restoreTemplate,
} from '@/lib/db-helpers-mongo';
import { getUserEmailFromRequest, getUserEmailFromBody } from '@/lib/api-helpers';
import { QuestionTemplate } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const templates = await getTemplates({ status, createdBy, includeDeleted });
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const template: Omit<QuestionTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      title: body.title,
      templateText: body.templateText,
      variants: body.variants || [],
      answerFunction: body.answerFunction || '',
      variables: body.variables || [],
      concepts: body.concepts || [],
      curriculumTags: body.curriculumTags || [],
      createdBy: body.createdBy || 'system',
      status: body.status || 'draft',
    };

    const id = await createTemplate(template);
    return NextResponse.json({ id, ...template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    await updateTemplate(id, updates);
    const updated = await getTemplate(id);
    return NextResponse.json({ template: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    if (action === 'restore') {
      await restoreTemplate(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

