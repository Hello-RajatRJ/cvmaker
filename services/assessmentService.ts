import { QUESTION_BANK, TECHNOLOGY_PACKS } from '../data/questionBank';
import { Question, RankTitle, TechnologyPack, TestResult } from '../types/assessment';

export class AssessmentService {
  static getTechnologyPacks(): TechnologyPack[] {
    return TECHNOLOGY_PACKS;
  }

  /**
   * Deterministic daily seed generator (e.g. 2026-08-06 -> seed 20260806)
   */
  private static getDailySeed(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  /**
   * Pseudo-random generator using daily seed
   */
  private static pseudoRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Fetch 70 questions for specified stack with daily shuffled question & option order
   */
  static getDailyShuffledQuestions(techId: string): Question[] {
    const baseQuestions = QUESTION_BANK.filter((q) => q.techId === techId);
    if (baseQuestions.length === 0) return [];

    const seed = this.getDailySeed();

    // Shuffle questions array using seed
    const shuffled = [...baseQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.pseudoRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Shuffle options order per question
    return shuffled.map((q, idx) => {
      const opts = [...q.options];
      for (let k = opts.length - 1; k > 0; k--) {
        const m = Math.floor(this.pseudoRandom(seed + idx + k) * (k + 1));
        [opts[k], opts[m]] = [opts[m], opts[k]];
      }
      return {
        ...q,
        options: opts,
      };
    });
  }

  /**
   * Calculate Rank Title based on score percentage
   */
  static computeRankTitle(scorePercentage: number): RankTitle {
    if (scorePercentage >= 90) return '🏆 Lead Architect';
    if (scorePercentage >= 75) return '⚡ Senior Engineer';
    if (scorePercentage >= 60) return '💡 Mid-Level Developer';
    return '🌱 Associate Engineer';
  }

  /**
   * Evaluate completed test session and produce result report
   */
  static evaluateTestSession(
    techId: string,
    questions: Question[],
    userAnswers: Record<string, { selectedOption: string | null; timeSpentSeconds: number }>
  ): TestResult {
    const techPack = TECHNOLOGY_PACKS.find((t) => t.id === techId);
    const techName = techPack ? techPack.name : techId;

    let correctCount = 0;
    const topicBreakdown: Record<string, { total: number; correct: number; percentage: number }> = {};

    questions.forEach((q) => {
      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = { total: 0, correct: 0, percentage: 0 };
      }
      topicBreakdown[q.topic].total += 1;

      const userSel = userAnswers[q.id]?.selectedOption;
      if (userSel === q.correctAnswer) {
        correctCount += 1;
        topicBreakdown[q.topic].correct += 1;
      }
    });

    Object.keys(topicBreakdown).forEach((topic) => {
      const item = topicBreakdown[topic];
      item.percentage = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const earnedRank = this.computeRankTitle(scorePercentage);

    const totalSeconds = Object.values(userAnswers).reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);
    const timeTakenMinutes = Math.max(1, Math.round(totalSeconds / 60));

    return {
      id: `test-${Date.now()}`,
      techId,
      techName,
      date: new Date().toISOString().split('T')[0],
      totalQuestions,
      correctAnswers: correctCount,
      scorePercentage,
      earnedRank,
      timeTakenMinutes,
      topicBreakdown,
    };
  }
}
