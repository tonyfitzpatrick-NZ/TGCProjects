import { createClient } from '@supabase/supabase-js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { project_id } = JSON.parse(event.body)

    if (!project_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'project_id is required' }) }
    }

    // 1. Get data from our Edge Function
    const { data: specData, error } = await supabase.functions.invoke('generate-specification', {
      body: { project_id }
    })

    if (error) throw error

    // 2. Generate PDF (Cover + Dynamic TOC)
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // === COVER PAGE ===
    // Navy header
    page.drawRectangle({
      x: 0,
      y: height - 240,
      width,
      height: 240,
      color: rgb(0.05, 0.12, 0.21), // Navy
    })

    // Gold accent line
    page.drawLine({
      start: { x: 50, y: height - 240 },
      end: { x: width - 50, y: height - 240 },
      thickness: 3,
      color: rgb(0.93, 0.74, 0.41), // Gold
    })

    // Title
    page.drawText('PROJECT SPECIFICATION', {
      x: width / 2,
      y: height - 320,
      size: 26,
      font: boldFont,
      color: rgb(0.05, 0.12, 0.21),
      alignment: 'center',
    })

    // Project Name
    page.drawText(specData.project?.name || 'Project', {
      x: width / 2,
      y: height - 380,
      size: 18,
      font: boldFont,
      color: rgb(0.05, 0.12, 0.21),
      alignment: 'center',
    })

    // Version
    page.drawText(specData.toc?.length ? `Sections: ${specData.section_count}` : 'Draft', {
      x: width / 2,
      y: height - 450,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
      alignment: 'center',
    })

    // === TABLE OF CONTENTS ===
    const tocPage = pdfDoc.addPage()

    tocPage.drawText('TABLE OF CONTENTS', {
      x: width / 2,
      y: height - 60,
      size: 18,
      font: boldFont,
      color: rgb(0.05, 0.12, 0.21),
      alignment: 'center',
    })

    let y = height - 120

    specData.toc?.forEach((section, index) => {
      tocPage.drawText(`${section.number}. ${section.title}`, {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      })
      tocPage.drawText(section.page || `${index + 3}`, {
        x: width - 50,
        y,
        size: 11,
        font,
        color: rgb(0.05, 0.12, 0.21),
        alignment: 'right',
      })
      y -= 22
    })

    // 3. Save PDF
    const pdfBytes = await pdfDoc.save()

    // 4. Upload to Supabase Storage
    const fileName = `${project_id}/specification-${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('specifications')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // 5. Get signed URL
    const { data: signedUrl } = await supabase.storage
      .from('specifications')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 7 days

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: signedUrl?.signedUrl,
        fileName,
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}