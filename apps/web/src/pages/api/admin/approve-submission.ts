import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/config';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  // Check authentication
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin
  if (!isAdmin(user.email)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return new Response(JSON.stringify({ error: 'Missing submissionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get submission with files
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, submission_files(*)')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (submission.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Submission already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create or find company
    const companySlug = slugify(submission.company_name);

    let { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single();

    if (!company) {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: submission.company_name,
          slug: companySlug,
          domain: submission.company_domain,
        })
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        return new Response(JSON.stringify({ error: 'Failed to create company' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      company = newCompany;
    }

    // Process each file - track success/failure
    const processedLogos: string[] = [];
    const fileErrors: string[] = [];

    for (const file of submission.submission_files || []) {
      try {
        // Download file from submissions bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('submissions')
          .download(file.storage_path);

        if (downloadError || !fileData) {
          console.error('File download error:', downloadError, 'Path:', file.storage_path);
          fileErrors.push(`Download failed for ${file.storage_path}: ${downloadError?.message || 'No data'}`);
          continue;
        }

        // Generate new path for logos bucket - include unique identifier to avoid conflicts
        const uniqueId = Date.now().toString(36);
        const newPath = `${companySlug}/${file.variant_type}-${file.color_mode}-${uniqueId}.${file.format}`;

        // Upload to logos bucket
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(newPath, fileData, {
            contentType: file.format === 'svg' ? 'image/svg+xml' : 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError, 'Path:', newPath);
          fileErrors.push(`Upload failed for ${newPath}: ${uploadError.message}`);
          continue;
        }

        // Create logo record
        const { error: logoError } = await supabase
          .from('logos')
          .insert({
            company_id: company.id,
            format: file.format,
            variant_type: file.variant_type,
            color_mode: file.color_mode,
            storage_path: newPath,
          });

        if (logoError) {
          console.error('Logo record error:', logoError);
          fileErrors.push(`Logo record failed: ${logoError.message}`);
          // Try to clean up uploaded file
          await supabase.storage.from('logos').remove([newPath]);
          continue;
        }

        processedLogos.push(newPath);
      } catch (err) {
        console.error('Unexpected error processing file:', err);
        fileErrors.push(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    // If no logos were processed successfully, fail the approval
    if (processedLogos.length === 0 && (submission.submission_files?.length || 0) > 0) {
      console.error('All file processing failed:', fileErrors);
      return new Response(JSON.stringify({
        error: 'Failed to process any files',
        details: fileErrors
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Status update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companyId: company.id,
      companySlug: companySlug,
      processedLogos: processedLogos.length,
      totalFiles: submission.submission_files?.length || 0,
      warnings: fileErrors.length > 0 ? fileErrors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Approval error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
