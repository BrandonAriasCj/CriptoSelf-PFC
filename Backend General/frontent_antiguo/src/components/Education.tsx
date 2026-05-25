import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, ExternalLink } from 'lucide-react';

export function Education() {
  const handleGoToAcademy = () => {
    window.location.href = '/academy';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Academia de Trading</CardTitle>
              <p className="text-muted-foreground">Aprende trading desde conceptos básicos hasta estrategias avanzadas</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Nueva Academia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎓 Nueva Academia Interactiva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hemos lanzado una nueva academia completa con lecciones estructuradas, 
            evaluaciones interactivas y seguimiento de progreso.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">📚 Módulos Incluidos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fundamentos del Trading</li>
                <li>• Análisis Técnico</li>
                <li>• Gestión de Riesgo</li>
                <li>• Trading Algorítmico</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">✨ Características:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Lecciones interactivas</li>
                <li>• Quizzes de evaluación</li>
                <li>• Progreso gamificado</li>
                <li>• Certificaciones</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleGoToAcademy}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Acceder a la Nueva Academia
          </Button>
        </CardContent>
      </Card>

      {/* Consejos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Consejos para Empezar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Comienza con los fundamentos antes de estrategias avanzadas',
              'Practica con el simulador antes de usar dinero real',
              'Completa los quizzes para reforzar el aprendizaje',
              'Toma notas durante las lecciones',
              'La gestión de riesgo es más importante que las ganancias'
            ].map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}