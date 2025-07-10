// src/components/Instructions.jsx
import Sidebar from "./Sidebar";
import icono from "/icono.png";

const Instructions = () => {
  return (
    <>
      <Sidebar />
      <div className="pt-20 px-4 max-w-3xl mx-auto scroll-smooth">
        <div className="flex items-center gap-4 mb-6">
          <img src={icono} alt="Icono de la app" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Instrucciones</h1>
        </div>

        {/* Índice sticky */}
        <div className="sticky top-20 bg-white z-10 border border-gray-200 p-4 rounded shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">📚 Índice</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a href="#instalar-ios" className="text-blue-600 underline">
                Cómo añadir esta página a tu pantalla de inicio (iOS)
              </a>
            </li>
            <li>
              <a href="#alpha-testing" className="text-blue-600 underline">
                Instrucciones de alpha testing
              </a>
            </li>
            <li>
              <a href="#olvido-password" className="text-blue-600 underline">
                ¿Qué hacer si olvidé mi contraseña?
              </a>
            </li>
          </ul>
        </div>

        {/* Resto del contenido igual... */}
        {/* ... */}
      </div>
    </>
  );
};

export default Instructions;