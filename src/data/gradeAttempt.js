export function gradeAttempt(questions, responses, totalMarks) {
  const responseMap = new Map(responses.map(response => [response.question_id, response]));
  const graded = questions.map(question => {
    const response = responseMap.get(question.id);
    const answer = String(response?.student_answer ?? '').trim().toUpperCase();
    const correct = String(question.correct_answer ?? '').trim().toUpperCase();
    return {
      question_id: question.id,
      is_correct: answer ? Boolean(correct) && answer === correct : null,
    };
  });
  const correct_count = graded.filter(row => row.is_correct === true).length;
  const wrong_count = graded.filter(row => row.is_correct === false).length;
  const skipped_count = graded.filter(row => row.is_correct === null).length;
  const marks = Number(totalMarks);
  return {
    graded, correct_count, wrong_count, skipped_count,
    score: questions.length ? correct_count * (Number.isFinite(marks) && marks > 0 ? marks / questions.length : 1) : 0,
  };
}
