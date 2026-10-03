-- Apply before deploying the protected student PDF viewer.
BEGIN;
DROP POLICY IF EXISTS "Everyone can read course pdfs" ON public.course_pdfs;

CREATE OR REPLACE FUNCTION public.course_pdf_metadata(p_course_id BIGINT)
RETURNS TABLE (id BIGINT, course_id BIGINT, title TEXT, day INTEGER, position INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pdf.id, pdf.course_id, pdf.title, pdf.day, pdf.position
  FROM public.course_pdfs pdf
  JOIN public.courses c ON c.id = pdf.course_id
  WHERE pdf.course_id = p_course_id
    AND auth.uid() IS NOT NULL
    AND (public.is_admin() OR EXISTS (
      SELECT 1 FROM public.profiles p,
        LATERAL unnest(string_to_array(coalesce(p.course, ''), ',')) access_name
      WHERE p.id = auth.uid() AND lower(trim(access_name)) = lower(trim(c.title))
    ))
  ORDER BY pdf.position, pdf.id;
$$;
REVOKE ALL ON FUNCTION public.course_pdf_metadata(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.course_pdf_metadata(BIGINT) TO authenticated;
COMMIT;
